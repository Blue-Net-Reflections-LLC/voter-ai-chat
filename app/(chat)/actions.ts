'use server';

import { type CoreUserMessage, generateText, type LanguageModelV1 } from 'ai';
import { cookies } from 'next/headers';
import { getAnthropicModel } from "@/chat-models/anthropic";

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: getAnthropicModel().model as unknown as LanguageModelV1,
    system: `\n
    - you will generate a short title (with proper casing) based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}
