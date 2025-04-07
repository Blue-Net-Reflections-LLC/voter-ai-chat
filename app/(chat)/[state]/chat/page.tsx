import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';

// This page now receives state as a parameter
export default async function Page(props: { params: { state: string } }) {
  const state = props.params.state; // <-- Access directly
  const id = generateUUID();

  // TODO: Validate the state param (e.g., check if it's a supported state)
  console.log(`Rendering chat for state: ${state}`);

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      key={id} 
      id={id}
      initialMessages={[]}
      selectedModelId={selectedModelId}
      state={state}
    />
  );
} 