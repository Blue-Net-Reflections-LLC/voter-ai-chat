import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat as PreviewChat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages, isUUID } from '@/lib/utils';

// This page now receives state and id as parameters
interface ChatPageProps {
  params: Promise<{
    id: string;
    state: string;
  }>;
}

export default async function Page(props: ChatPageProps) {
  const id = (await props.params).id;     // <-- Access directly
  const state = (await props.params).state; // <-- Access directly

  // --- Add Guard Clause --- 
  // Check if state is valid before proceeding
  if (!state || typeof state !== 'string' || !/^[a-zA-Z]{2}$/.test(state)) {
      console.error(`Invalid state param received in chat [id] page: ${state}`);
      // Return null or a loading/error component
      // You could potentially redirect to /chat here as well if state is totally invalid
      // return redirect('/chat');
      return <div>Loading state data...</div>; 
  }
  // --- End Guard Clause ---

  console.log(`Rendering chat ${id} for state: ${state}`);

  // Verify that the specified id is a UUID
  if (id && !isUUID(id)) {
    return notFound();
  }

  const chat = await getChatById({ id });

  if (!chat) {
    // Redirect to the base chat page for the current state if chat not found
    return redirect(`/${state}/chat`); 
  }

  const session = await auth();

  if (!session || !session.user) {
    // Use notFound for auth issues on specific chat pages
    return notFound(); 
  }

  if (session.user.id !== chat.userId) {
    return notFound();
  }

  // TODO: Check if session.user.selectedState matches the `state` param?
  // Or assume navigation is correct?
  // if (session.user.selectedState?.toLowerCase() !== state.toLowerCase()) {
  //   return notFound(); // Or redirect?
  // }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <PreviewChat
      id={chat.id}
      initialMessages={convertToUIMessages(messagesFromDb)}
      selectedModelId={selectedModelId}
      state={state}
    />
  );
} 