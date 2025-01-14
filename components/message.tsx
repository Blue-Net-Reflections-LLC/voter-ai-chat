'use client';

import type { Message } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import type { Dispatch, SetStateAction } from 'react';

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
}: {
	chatId: string;
	message: Message;
	block: UIBlock;
	setBlock: Dispatch<SetStateAction<UIBlock>>;
	vote: Vote | undefined;
	isLoading: boolean;
	streaming: boolean;
}) => {

	return (
		<motion.div
			className={`w-full mx-auto max-w-3xl px-4 group/message` + (message.role === 'user' ? " pt-8 border-t border-border" : '')}
			initial={{ y: 5, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			data-role={message.role}
		>
			<div
				className={cx(
					'group-data-[role=user]/message:bg-red-600 group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
					{
						'text-xs': message.role === 'assistant'
					}
				)}
			>
				{message.role === 'assistant' && (
					<div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
						<RippleEffect isAnimating={streaming || isLoading}><Logo width={32} /></RippleEffect>
					</div>
				)}

				<div className="flex flex-col gap-2 w-full overflow-x-hidden">
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
