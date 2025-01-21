'use client';

import type { Message } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import type { Dispatch, SetStateAction } from 'react';
import { cn } from '@/lib/utils';

import type { Vote } from '@/lib/db/schema';

import type { UIBlock } from './block';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import ErrorBubble from "@/components/ui/error-bubble";
import RippleEffect from "@/components/RippleEffect";
import Logo from "@/components/ui/voter-ai-icon";

export const hideToolUiList = [
	"fetchTableDdls",
	"executeSelects",
	"listVoterDataMappingKeysTool",
	"voterDataColumnLookupTool",
	"similarBillsTool",
	"billsQueryTool"
];

const isToolResult = (message: Message) => message?.toolInvocations?.find(v => v.state === 'result')

export const PreviewMessage = ({
	chatId,
	message,
	block,
	setBlock,
	vote,
	isLoading,
	streaming,
	isFirstAssistantMessage = true,
}: {
	chatId: string;
	message: Message;
	block: UIBlock;
	setBlock: Dispatch<SetStateAction<UIBlock>>;
	vote: Vote | undefined;
	isLoading: boolean;
	streaming: boolean;
	isFirstAssistantMessage?: boolean;
}) => {

	return (
		<motion.div
			className={cn(
				"w-full group/message",
				message.role === 'user' ? "flex justify-end mb-6" : "mt-6"
			)}
			initial={{ y: 5, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			data-role={message.role}
		>
			<div
				className={cn(
					'flex gap-4',
					message.role === 'user' 
						? 'bg-red-600 text-primary-foreground px-4 py-2 rounded-xl max-w-[75%]' 
						: 'w-full text-base'
				)}
			>
				{message.role === 'assistant' && isFirstAssistantMessage && (
					<div className="size-8 flex items-center justify-center shrink-0 relative">
						<span className="text-2xl" role="img" aria-label="AI Assistant">🤖</span>
						<span className="text-lg absolute -top-4 -right-2" role="img" aria-label="Idea">💡</span>
					</div>
				)}
				{message.role === 'assistant' && !isFirstAssistantMessage && (
					<div className="size-8 shrink-0" />
				)}

				<div className={cn(
					"flex flex-col gap-2 overflow-x-hidden",
					message.role === 'user' ? 'w-fit' : 'w-full'
				)}>
					{message.content && (
						<div className="flex flex-col gap-4">
							<Markdown streaming={streaming}>{message.content as string}</Markdown>
						</div>
					)}

					{message.toolInvocations && message.toolInvocations.length > 0 && (
						<div className="flex flex-col gap-4">
							{message.toolInvocations.map((toolInvocation) => {
								const { toolName, toolCallId, state, args } = toolInvocation;
								if (state === 'result') {
									const { result } = toolInvocation;

									return (
										<div key={toolCallId}>
											{toolName === 'errorMessageTool' ? (
												<ErrorBubble message={args?.errorMessage || "Error Message"} />
											) : toolName === 'fetchStaticMapTool' ? result?.mapUrl && (
												<img
													src={result?.mapUrl || ""}
													alt="Static Map"
													style={{ maxWidth: "100%", height: "auto" }}
												/>
											) : toolName === 'fetchStaticChartTool' ? result?.chartUrl && (
												<img
													src={result?.chartUrl || ""}
													alt="Static Chart"
													style={{ maxWidth: "100%", height: "auto" }}
												/>
											) : !hideToolUiList.some(v => v === toolName) && (
												<pre>{JSON.stringify(result, null, 2)}</pre>
											)}
										</div>
									);
								}
								return (
									<div
										key={toolCallId}
										className={cx({
											skeleton: ['getWeather'].includes(toolName),
										})}
									>
									</div>
								);
							})}
						</div>
					)}

					{message.experimental_attachments && (
						<div className="flex flex-row gap-2">
							{message.experimental_attachments.map((attachment) => (
								<PreviewAttachment
									key={attachment.url}
									attachment={attachment}
								/>
							))}
						</div>
					)}

					<MessageActions
						key={`action-${message.id}`}
						chatId={chatId}
						message={message}
						vote={vote}
						isLoading={isLoading}
						streaming={streaming}
					/>
				</div>
			</div>
		</motion.div>
	);
};
