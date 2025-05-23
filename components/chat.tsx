'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { ChevronDown, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { BetterTooltip } from './ui/tooltip';

import { ChatHeader } from '@/components/chat-header';
import { PreviewMessage } from '@/components/message';
import { useScrollToBottom } from '@/components/use-scroll-to-bottom';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { RolesSidebar, type Role } from '@/components/roles-sidebar';

import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Overview } from './overview';
import { toast } from 'sonner';
import TrackingLink from "@/components/ui/TrackingLink";
import { ThinkingMessage } from "@/components/ThinkingMessage";
import { EditProvider } from './message';

// Example roles - replace with actual roles from your system
const AVAILABLE_ROLES: Role[] = [
	{ id: 'voter', name: 'Registered Voter', icon: '🗳️', description: 'Access your voter registration status and district information' },
	{ id: 'researcher', name: 'Researcher', icon: '📚', description: 'Analyze voter registration patterns and demographics' },
	{ id: 'canvasser', name: 'Canvasser', icon: '📢', description: 'Get insights for voter outreach and canvassing planning' },
	{ id: 'media', name: 'News Media', icon: '📰', description: 'Access data for election coverage and voter trends' },
	{ id: 'candidate', name: 'Politician/Candidate', icon: '👥', description: 'Understand your constituency and voter demographics' },
];

export function Chat({
	id,
	initialMessages,
	selectedModelId,
	state,
}: {
	id: string;
	initialMessages: Array<Message>;
	selectedModelId: string;
	state: string;
}) {
	const {mutate} = useSWRConfig();
	const [streaming, setStreaming] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role>();
	const [isCollapsed, setIsCollapsed] = useState(false);

	const {
		messages,
		setMessages,
		handleSubmit,
		input,
		setInput,
		append,
		isLoading,
		stop,
		data: streamingData,
		error,
	} = useChat({
		api: `/api/chat?state=${state}`,
		body: {id, modelId: selectedModelId},
		initialMessages,
		onResponse: () => {
			setStreaming(true);
		},
		onFinish: () => {
			// Mutate using the state-aware key
			const historyApiKey = state ? `/api/history?state=${state}` : '/api/history'; // Construct key
			mutate(historyApiKey); 
			setStreaming(false)
		},
	});
	const {width: windowWidth = 1920, height: windowHeight = 1080} =
		useWindowSize();

	const [block, setBlock] = useState<UIBlock>({
		documentId: 'init',
		content: '',
		title: '',
		status: 'idle',
		isVisible: false,
		boundingBox: {
			top: windowHeight / 4,
			left: windowWidth / 4,
			width: 250,
			height: 50,
		},
	});

	const {data: votes} = useSWR<Array<Vote>>(
		`/api/vote?chatId=${id}`,
		fetcher,
	);

	const [messagesContainerRef, bottomRef, isAtBottom, scrollToBottom] = useScrollToBottom<HTMLDivElement>();

	const [attachments, setAttachments] = useState<Array<Attachment>>([]);

	useEffect(() => {
		if (error) {
			console.error(error);
			toast.error(`Processing error: ${error.message}`);
		}
	}, [error])

	const handleRoleSelect = async (role: Role) => {
		try {
			const response = await fetch('/api/profile/role', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: role.id }),
			});
			
			if (!response.ok) {
				throw new Error('Failed to update role');
			}
			
			setSelectedRole(role);
		} catch (error) {
			console.error('Error updating role:', error);
			toast.error('Failed to update role');
		}
	};

	// Fetch current role on mount
	useEffect(() => {
		fetch('/api/profile/role')
			.then(res => res.json())
			.then(data => {
				const role = AVAILABLE_ROLES.find(r => r.id === data.role);
				if (role) {
					setSelectedRole(role);
				}
			})
			.catch(console.error);
	}, []);

	return (
		<EditProvider>
			<>
				<div className="flex min-w-0 h-dvh bg-muted/30">
					<div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
						<div className="mx-auto w-full max-w-[90rem]">
							<ChatHeader selectedModelId={selectedModelId}/>
						</div>
					</div>
					<div ref={messagesContainerRef} className="flex flex-1 min-w-0 overflow-y-auto pt-16">
						<div className={cn(
							"flex flex-col flex-1 min-w-0 transition-all duration-300",
							!isCollapsed && "pr-64"
						)}>
							<div className="flex flex-col min-w-0 gap-16 flex-1 pb-36">
								{messages.length === 0 && <Overview/>}
								{messages.reduce((groups: JSX.Element[], message, index) => {
									if (message.role === 'user') {
										// Get all assistant responses until the next user message
										const responses = [];
										let i = index + 1;
										while (i < messages.length && messages[i].role === 'assistant') {
											// Only add non-empty assistant messages
											if (messages[i].content) {
												responses.push(messages[i]);
											}
											i++;
										}
										
										groups.push(
											<div key={message.id} className="bg-card/50 rounded-xl p-6 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.02] dark:shadow-lg dark:shadow-white/[0.03] w-full max-w-[50rem] mx-auto px-6">
												<PreviewMessage
													key={message.id}
													chatId={id}
													message={message}
													block={block}
													setBlock={setBlock}
													vote={votes?.find((v) => v.messageId === message.id)}
													isLoading={isLoading}
													streaming={streaming}
													setMessages={setMessages}
													append={append}
												/>
												{responses.map((response, responseIndex) => (
													<PreviewMessage
														key={response.id}
														chatId={id}
														message={response}
														block={block}
														setBlock={setBlock}
														vote={votes?.find((v) => v.messageId === response.id)}
														isLoading={isLoading}
														streaming={streaming}
														isFirstAssistantMessage={responseIndex === 0}
														setMessages={setMessages}
														append={append}
													/>
												))}
											</div>
										);
									}
									return groups;
								}, [])}

								{isLoading &&
									// messages.length > 0 &&
									// messages[messages.length - 1].role === 'user' &&
									(
										<ThinkingMessage haltAnimation={streaming}/>
									)}

								<div ref={bottomRef} />
							</div>
							<div className="absolute bottom-0 left-0 right-0 z-10">
								<div className={cn(
									"relative mx-auto w-full transition-all duration-300",
									!isCollapsed && "pr-64"
								)}>
									<div className="w-full max-w-[50rem] mx-auto">
										<form className="flex mx-auto pb-3 md:pb-2 gap-2 w-full px-6">
											<MultimodalInput
												chatId={id}
												input={input}
												setInput={setInput}
												handleSubmit={handleSubmit}
												isLoading={isLoading}
												stop={stop}
												attachments={attachments}
												setAttachments={setAttachments}
												messages={messages}
												setMessages={setMessages}
												append={append}
												state={state}
											/>
										</form>
										<div className="pb-1.5 text-center text-sm">Developed by{' '}
											<TrackingLink
												category="chat"
												action="developer-click"
												className="text-blue-500 underline hover:text-blue-700" href="mailto:horace.reid@bluenetreflections.com">Horace Reid III</TrackingLink> @ 2024</div>
									</div>
								</div>
							</div>
						</div>
						
						<RolesSidebar
							roles={AVAILABLE_ROLES}
							selectedRole={selectedRole}
							onRoleSelect={handleRoleSelect}
							isCollapsed={isCollapsed}
							setIsCollapsed={setIsCollapsed}
						/>
					</div>
				</div>

				<AnimatePresence>
					{block?.isVisible && (
						<Block
							chatId={id}
							input={input}
							setInput={setInput}
							handleSubmit={handleSubmit}
							isLoading={isLoading}
							stop={stop}
							attachments={attachments}
							setAttachments={setAttachments}
							append={append}
							block={block}
							setBlock={setBlock}
							messages={messages}
							setMessages={setMessages}
							votes={votes}
							streaming={streaming}
							state={state}
						/>
					)}
				</AnimatePresence>

				<BlockStreamHandler streamingData={streamingData} setBlock={setBlock}/>

				{!isAtBottom && (
					<div className={cn(
						"absolute bottom-32 left-0 right-0 z-10",
						!isCollapsed && "pr-64"
					)}>
						<div className="w-full max-w-[50rem] mx-auto px-6">
							<div className="flex justify-center">
								<BetterTooltip content="Jump to bottom">
									<Button
										size="icon"
										variant="outline"
										className="size-8 rounded-full opacity-80 hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
										onClick={scrollToBottom}
									>
										<ArrowDown className="size-4" />
									</Button>
								</BetterTooltip>
							</div>
						</div>
					</div>
				)}

				<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-36 pointer-events-none" />
			</>
		</EditProvider>
	);
}
