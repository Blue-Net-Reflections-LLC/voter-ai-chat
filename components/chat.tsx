'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

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
}: {
	id: string;
	initialMessages: Array<Message>;
	selectedModelId: string;
}) {
	const {mutate} = useSWRConfig();
	const [streaming, setStreaming] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role>();

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
		body: {id, modelId: selectedModelId},
		initialMessages,
		onResponse: () => {
			setStreaming(true);
		},
		onFinish: () => {
			mutate('/api/history');
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

	const [messagesContainerRef, messagesEndRef] =
		useScrollToBottom<HTMLDivElement>();

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
		<>
			<div className="flex min-w-0 h-dvh bg-muted/30">
				<div className="flex flex-col flex-1 min-w-0">
					<ChatHeader selectedModelId={selectedModelId}/>
					<div
						ref={messagesContainerRef}
						className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
					>
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
									<div key={message.id} className="bg-card/50 rounded-xl p-6 shadow-sm max-w-[50rem] mx-auto w-full px-4">
										<PreviewMessage
											key={message.id}
											chatId={id}
											message={message}
											block={block}
											setBlock={setBlock}
											vote={votes?.find((v) => v.messageId === message.id)}
											isLoading={isLoading}
											streaming={streaming}
										/>
										{responses.map(response => (
											<PreviewMessage
												key={response.id}
												chatId={id}
												message={response}
												block={block}
												setBlock={setBlock}
												vote={votes?.find((v) => v.messageId === response.id)}
												isLoading={isLoading}
												streaming={streaming}
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

						<div
							ref={messagesEndRef}
							className="shrink-0 min-w-[24px] min-h-[24px]"
						/>
					</div>
					<form className="flex mx-auto px-4 pb-3 md:pb-2 gap-2 w-full max-w-[56rem]">
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
						/>
					</form>
					<div className="pb-1.5 text-center text-sm">Developed by{' '}
						<TrackingLink
							category="chat"
							action="developer-click"
							className="text-blue-500 underline hover:text-blue-700"   href="mailto:horace.reid@bluenetreflections.com">Horace Reid III</TrackingLink> @ 2024</div>
				</div>
				
				<RolesSidebar
					roles={AVAILABLE_ROLES}
					selectedRole={selectedRole}
					onRoleSelect={handleRoleSelect}
				/>
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
					/>
				)}
			</AnimatePresence>

			<BlockStreamHandler streamingData={streamingData} setBlock={setBlock}/>
		</>
	);
}
