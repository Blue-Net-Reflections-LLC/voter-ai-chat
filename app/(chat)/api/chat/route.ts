import { convertToCoreMessages, type CoreUserMessage, createDataStreamResponse, type Message, streamText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { models } from '@/lib/ai/models';
import { deleteChatById, getChatById, saveChat, saveMessages, } from '@/lib/db/queries';
import { generateUUID, getMostRecentUserMessage, sanitizeResponseMessages, } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { getVoterAiChatUiToolset } from "@/lib/voter/query/voter-ui-toolset";

import { fetchStaticMapTool } from "@/lib/tools/fetchStaticMapTool";
import { getAnthropicModel } from "@/chat-models/anthropic";
import { fetchStaticChartTool } from "@/lib/tools/fetchStaticChartTool";
import fs from 'fs/promises'; // Import fs/promises
import path from 'path'; // Import path
import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest/Response

export const maxDuration = 60; // This function can run for a maximum of 30 seconds

// Helper function to load system prompt
async function getSystemPrompt(state: string | undefined): Promise<string> {
  // Default prompt if state is missing or invalid (though middleware should prevent this)
  const defaultPrompt = "You are a helpful assistant."; 
  
  if (!state || typeof state !== 'string' || !/^[a-zA-Z]{2}$/.test(state)) {
    console.warn('Invalid or missing state in getSystemPrompt, using default.');
    return defaultPrompt;
  }

  const stateAbbr = state.toUpperCase();
  // TODO: Check against a list of *supported* states here again for safety?
  
  const promptPath = path.join(process.cwd(), 'lib', 'state-prompts', stateAbbr.toLowerCase(), 'system-prompt.md');
  
  try {
    const promptContent = await fs.readFile(promptPath, 'utf-8');
    console.log(`Loaded system prompt for state: ${stateAbbr}`);
    return promptContent;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`System prompt not found for state: ${stateAbbr} at path ${promptPath}`);
      // Return a generic error prompt or the default, but signal an issue
      return `Error: System configuration for state ${stateAbbr} is missing. Please contact support.`; 
    } else {
      console.error(`Error reading system prompt for state ${stateAbbr}:`, error);
      // Throw an error to be caught by the main handler, resulting in 500
      throw new Error(`Failed to load system configuration for state ${stateAbbr}.`);
    }
  }
}

const attachCacheControl = (userMessage: CoreUserMessage) => {
  if (typeof userMessage.content === 'string') {
    // Convert the string to an array containing a single TextPart
    userMessage.content = [
      {
        type: 'text',
        text: userMessage.content,
        experimental_providerMetadata: {
          anthropic: {cacheControl: {type: 'ephemeral'}},
        },
      },
    ];
  }

}

export async function POST(request: NextRequest) {
  try {
    // Extract state from query parameters
    const { searchParams } = request.nextUrl;
    const state = searchParams.get('state');
    console.log(`[API Chat POST] State from query param: ${state}, type: ${typeof state}`);

    // Read body for other data (messages, id, modelId)
    const {
      id,
      messages: originMessages,
      modelId,
      // state is now from query params, not body
    }: { id: string; messages: Array<Message>; modelId: string } = await request.json();
    console.log(`[API Chat POST] Body contents: id=${id}, modelId=${modelId}, messages=${originMessages.length}`);

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', {status: 401});
    }
    
    // Validate state (now from query param)
    if (!state || typeof state !== 'string' || !/^[a-zA-Z]{2}$/.test(state)) {
        console.error(`[API Chat POST] Invalid state detected: '${state}'`);
        return NextResponse.json({ error: 'Invalid state provided in request query.' }, { status: 400 });
    }

    const model = models.find((model) => model.id === modelId);

    if (!model) {
      return new Response('Model not found', {status: 404});
    }
    let messageCnt = 0;
    let cacheCnt = 0;
    // Due to token limitations, we need to limit the tokens generated by the app.
    // so let's only send the last 10 messages to the model.
    const messages = originMessages.reverse().filter((v) => {
      if (messageCnt < 50) {
        if (v.role === "user") {
          messageCnt++
          if (cacheCnt < 4) {
            attachCacheControl(v as CoreUserMessage);
            cacheCnt++;
          }
          return true
        } else {
          return !(v.toolInvocations?.length && v.toolInvocations?.find((u: any) => !u?.result))
        }
      }
      return false
    }).reverse()

    const coreMessages = convertToCoreMessages(messages)
      ?.filter(v => {
        const content = v.content
        if (Array.isArray(content)) {
          return !!content?.length
        } else if (typeof content === 'number') {
          return true
        }
        return !!content
      })

    const userMessage = getMostRecentUserMessage(coreMessages);
    if (!userMessage) {
      return new Response('No user message found', {status: 400});
    }

    const chat = await getChatById({id});

    if (!chat) {
      const title = await generateTitleFromUserMessage({message: userMessage});
      await saveChat({id, userId: session.user.id, title});
    }

    await saveMessages({
      messages: [
        {...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id},
      ],
    });

    // --- Load State-Specific System Prompt ---
    const systemPromptContent = await getSystemPrompt(state);
    if (systemPromptContent.startsWith('Error:')) {
        return new Response(systemPromptContent, { status: 500 });
    }

    // --- Inject Current Date ---
    const currentDate = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const finalSystemPrompt = `Current date is ${currentDate}.\n\n${systemPromptContent}`;
    // -----------------------------------------

    return createDataStreamResponse({
      execute: async (streamingData) => {
        const {model /* Remove hardcoded systemMessage here */ } = getAnthropicModel()
        streamingData.writeData('initialized call');

        const result = streamText({
        // @ts-expect-error - Type mismatch between SDK versions but works at runtime
          model: model as Record<string, any>,
          system: finalSystemPrompt,
          messages: coreMessages,
          maxSteps: 20,
          tools: {
            ...getVoterAiChatUiToolset(),
            fetchStaticMapTool,
            fetchStaticChartTool,
          },
          onFinish: async ({response: {messages: responseMessages}}) => {
            if (session.user?.id) {
              try {
                const responseMessagesWithoutIncompleteToolCalls =
                  sanitizeResponseMessages(responseMessages);

                await saveMessages({
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      const messageId = generateUUID();

                      return {
                        id: messageId,
                        chatId: id,
                        role: message.role,
                        content: message.content,
                        createdAt: new Date(),
                      };
                    },
                  ),
                });
              } catch (error) {
                console.error('Failed to save chat', error);
              }
            }
            streamingData.writeData('call completed');
          },
        });

        result.mergeIntoDataStream(streamingData);
        // console.log(result.text);
        console.log("Cache Stats.", (await result.experimental_providerMetadata)?.anthropic);

      },
      onError: (error: any) => {
        console.error(error);
        if (error?.type === 'overloaded_error') {
          return "The system is overloaded...Please try again later."
        }
        return 'Oops! Something went wrong. Please try again in a few moments.';
      },
    });
  } catch (error) {
    console.error("Error processing request", error);
     // Handle errors from getSystemPrompt here as well
    if (error instanceof Error && error.message.includes('Failed to load system configuration')) {
        return new Response(error.message, { status: 500 });
    }
    return new Response('Oops! Something went wrong. Please try again in a few moments.', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!request.url) {
      return new Response('Invalid request URL', { status: 400 });
    }
    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Not Found', {status: 404});
    }

    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', {status: 401});
    }

    try {
      const chat = await getChatById({id});

      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', {status: 401});
      }

      await deleteChatById({id});

      return new Response('Chat deleted', {status: 200});
    } catch (error) {
      return new Response('An error occurred while processing your request', {
        status: 500,
      });
    }
  } catch (error) {
    return new Response('Invalid request URL', { status: 400 });
  }
}
