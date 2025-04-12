import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';

// Define props interface with params as a Promise
interface StateChatPageProps {
  params: Promise<{ 
    state: string;
  }>;
}

// This page now receives state as a parameter
export default async function Page(props: StateChatPageProps) {
  // Await the params promise before accessing state
  const state = (await props.params).state;
  const id = generateUUID();

  // --- Add Guard Clause --- 
  // Basic check: Ensure state is a non-empty string and looks like a state code
  if (!state || typeof state !== 'string' || !/^[a-zA-Z]{2}$/.test(state)) {
      console.error(`Invalid state param received in page: ${state}`);
      return <div>Loading state...</div>; // Or a loading indicator
  }
  // --- End Guard Clause ---

  console.log(`Rendering chat for state: ${state}`);

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      state={state} // Pass the awaited state down
    />
  );
} 