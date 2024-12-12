import { convertToCoreMessages, type CoreUserMessage, createDataStreamResponse, type Message, streamText, } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { models } from '@/lib/ai/models';
import { deleteChatById, getChatById, saveChat, saveMessages, } from '@/lib/db/queries';
import { generateUUID, getMostRecentUserMessage, sanitizeResponseMessages, } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { getVoterAiChatUiToolset } from "@/lib/voter/query/voter-ui-toolset";

import { fetchStaticMapTool } from "@/lib/tools/fetchStaticMapTool";
import { getAnthropicModel } from "@/chat-models/anthropic";
import { fetchStaticChartTool } from "@/lib/tools/fetchStaticChartTool";

export const maxDuration = 60; // This function can run for a maximum of 30 seconds
const attachCacheControl = (userMessage: CoreUserMessage) => {
	if (typeof userMessage.content === 'string') {
		// Convert the string to an array containing a single TextPart
		userMessage.content = [
			{
				type: 'text',
				text: userMessage.content,
				experimental_providerMetadata: {
					anthropic: { cacheControl: { type: 'ephemeral' } },
				},
			},
		];
	}

}
export async function POST(request: Request) {
	try {
		const {
			id,
			messages: originMessages,
			modelId,
		}: { id: string; messages: Array<Message>; modelId: string } =
			await request.json();

		const session = await auth();

		if (!session || !session.user || !session.user.id) {
			return new Response('Unauthorized', {status: 401});
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

		return createDataStreamResponse({
			execute: async (streamingData) => {
				const { model, systemMessage: system } = getAnthropicModel()
				streamingData.writeData('initialized call');

				const result = streamText({
					model,
					system,
					messages: coreMessages,
					maxSteps: 20,
//					onStepFinish: ({response: {messages}}) => {
					// console.log(messages);
//					},
					// experimental_activeTools: allTools,
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
					experimental_telemetry: {
						isEnabled: true,
						functionId: 'stream-text',
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
		return new Response('Oops! Something went wrong. Please try again in a few moments.', {
			status: 500,
		});
	}
}

export async function DELETE(request: Request) {
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
}
