'use client';

import type { Message } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import type { Dispatch, SetStateAction } from 'react';

import type { Vote } from '@/lib/db/schema';

import type { UIBlock } from './block';
import { SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import ErrorBubble from "@/components/ui/error-bubble";

export const hideToolUiList = [
	"fetchTableDdls",
	"executeSelects",
	"listVoterDataMappingKeysTool",
	"voterDataColumnLookupTool",
	"fetchStaticMapTool",
];

const isToolResult = (message: Message) =>  message?.toolInvocations?.find(v => v.state  === 'result')

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
			className={`w-full mx-auto max-w-3xl px-4 group/message`}
			initial={{y: 5, opacity: 0}}
			animate={{y: 0, opacity: 1}}
			data-role={message.role}
		>
			<div
				className={cx(
					'group-data-[role=user]/message:bg-red-600 group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
				)}
			>
				{message.role === 'assistant' && (
					<div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
						<SparklesIcon size={14}/>
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
								const {toolName, toolCallId, state, args} = toolInvocation;
								if (state === 'result') {
									const {result} = toolInvocation;

									return (
										<div key={toolCallId}>
											{toolName === 'errorMessageTool' ? (
												<ErrorBubble message={args?.errorMessage || "Error Message"}/>
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
					/>
				</div>
			</div>
		</motion.div>
	);
};

export const ThinkingMessage = () => {
	const role = 'assistant';

	return (
		<motion.div
			className="w-full mx-auto max-w-3xl px-4 group/message "
			initial={{y: 5, opacity: 0}}
			animate={{y: 0, opacity: 1, transition: {delay: 1}}}
			data-role={role}
		>
			<div
				className={cx(
					'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
					{
						'group-data-[role=user]/message:bg-muted': true,
					},
				)}
			>
				<div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
					<SparklesIcon size={14}/>
				</div>

				<div className="flex flex-col gap-2 w-full">
					<div className="flex flex-col gap-4 text-muted-foreground">
						Thinking...
					</div>
				</div>
			</div>
		</motion.div>
	);
};
