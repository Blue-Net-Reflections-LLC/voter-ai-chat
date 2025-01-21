import type { Message } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, PenIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useLayoutEffect, useState } from "react";

export function MessageActions({
  chatId,
  message,
  vote,
  isLoading,
	streaming,
  onEdit,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
	streaming: boolean;
  onEdit?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();
	const [initialized, setInitialized] = useState(false);
	useLayoutEffect(() => {
		if (!streaming && !isLoading) {
			setInitialized(true)
		}
	}, [isLoading, streaming])

  if (message.toolInvocations && message.toolInvocations.length > 0)
    return null;

  return initialized && (
    <div className="flex items-center gap-2">
      {message.role === 'user' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onEdit}
              className="p-1 hover:bg-muted/50 rounded-md"
              disabled={isLoading || streaming}
            >
              <PenIcon size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit message</TooltipContent>
        </Tooltip>
      ) : (
        <button
          onClick={async () => {
            await copyToClipboard(message.content as string);
            toast.success('Copied to clipboard!');
          }}
          className="p-1 hover:bg-muted/50 rounded-md"
        >
          <CopyIcon size={14} />
        </button>
      )}
    </div>
  );
}
