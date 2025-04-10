'use client';

import type { Message, CreateMessage, ChatRequestOptions } from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import type { Dispatch, SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { useState, createContext, useContext } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

import type { Vote } from '@/lib/db/schema';

import type { UIBlock } from './block';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import ErrorBubble from "@/components/ui/error-bubble";

export const hideToolUiList = [
	"executeSelects",
];

const isToolResult = (message: Message) => message?.toolInvocations?.find(v => v.state === 'result')

interface EditContextType {
	activeEditId: string | null;
	setActiveEditId: (id: string | null) => void;
}

const EditContext = createContext<EditContextType | null>(null);

export function EditProvider({ children }: { children: React.ReactNode }) {
	const [activeEditId, setActiveEditId] = useState<string | null>(null);
	return (
		<EditContext.Provider value={{ activeEditId, setActiveEditId }}>
			{children}
		</EditContext.Provider>
	);
}

function useEditContext() {
	const context = useContext(EditContext);
	if (!context) {
		throw new Error('useEditContext must be used within an EditProvider');
	}
	return context;
}

export const PreviewMessage = ({
	chatId,
	message,
	block,
	setBlock,
	vote,
	isLoading,
	streaming,
	isFirstAssistantMessage = true,
	setMessages,
	append,
}: {
	chatId: string;
	message: Message;
	block: UIBlock;
	setBlock: Dispatch<SetStateAction<UIBlock>>;
	vote: Vote | undefined;
	isLoading: boolean;
	streaming: boolean;
	isFirstAssistantMessage?: boolean;
	setMessages?: Dispatch<SetStateAction<Message[]>>;
	append: (message: Message | CreateMessage, options?: ChatRequestOptions) => Promise<string | null | undefined>;
}) => {
	const { activeEditId, setActiveEditId } = useEditContext();
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(message.content as string);

	const startEditing = () => {
		if (activeEditId === null) {
			setActiveEditId(message.id);
			setIsEditing(true);
		}
	};

	const stopEditing = () => {
		if (activeEditId === message.id) {
			setActiveEditId(null);
			setIsEditing(false);
		}
	};

	const handleSave = async () => {
		if (setMessages) {
			// If content hasn't changed, just close the editor
			if (editedContent === message.content) {
				stopEditing();
				return;
			}

			// Optimistically update UI
			setMessages((prevMessages: Message[]) => {
				const messageIndex = prevMessages.findIndex(msg => msg.id === message.id);
				if (messageIndex === -1) return prevMessages;
				
				// Keep only messages up to the edited message
				const truncatedMessages = prevMessages.slice(0, messageIndex);
				
				// Add the edited message as the latest message
				const updatedMessage = {
					...message,
					content: editedContent
				};
				
				return [...truncatedMessages, updatedMessage];
			});
			
			// Close editor immediately for optimistic UI
			stopEditing();

			// Then get new response
			await append({
				role: 'assistant',
				content: '',
				id: crypto.randomUUID(),
			}, {
				body: {
					editedMessageId: message.id,
					editedContent: editedContent
				}
			});
		}
	};

	const handleCancel = () => {
		setEditedContent(message.content as string);
		stopEditing();
	};

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
					'relative flex gap-4 group transition-all duration-300 ease-out',
					message.role === 'user' 
						? cn('bg-red-600 text-primary-foreground px-4 py-2 rounded-xl transition-all duration-300 ease-out',
							isEditing 
								? 'w-full max-w-[50rem] mx-auto' 
								: 'w-fit max-w-[75%]'
						)
						: 'w-full text-base'
				)}
			>
				{message.role === 'user' && !isLoading && !isEditing && activeEditId === null && (
					<div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<MessageActions
							key={`action-${message.id}`}
							chatId={chatId}
							message={message}
							vote={vote}
							isLoading={isLoading}
							streaming={streaming}
							onEdit={startEditing}
						/>
					</div>
				)}

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
					"flex flex-col gap-2 overflow-x-hidden transition-all duration-300 ease-out",
					isEditing ? 'w-full' : 'w-fit'
				)}>
					{message.content && (
						<div className="flex flex-col gap-4 w-full">
							{isEditing ? (
								<div className="flex flex-col gap-2 w-full">
									<Textarea
										value={editedContent}
										onChange={(e) => setEditedContent(e.target.value)}
										className="min-h-[75px] w-full resize-none rounded-xl bg-background/50 text-foreground border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-foreground/50 dark:bg-background/5 dark:text-primary-foreground dark:placeholder:text-primary-foreground/50 transition-all duration-300 ease-out"
										placeholder="Edit your message..."
										autoFocus
									/>
									<div className="flex justify-end gap-2">
										<Button
											variant="ghost"
											onClick={handleCancel}
											className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
										>
											Cancel
										</Button>
										<Button
											onClick={handleSave}
											className="bg-background/50 hover:bg-background/80 text-primary-foreground transition-colors"
										>
											Save
										</Button>
									</div>
								</div>
							) : (
								<Markdown streaming={streaming}>{message.content as string}</Markdown>
							)}
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
				</div>
			</div>
		</motion.div>
	);
};
