'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Role } from './roles-sidebar';

type Suggestion = {
  text: string;
  description?: string;
};

type SuggestionsWidgetProps = {
  selectedRole?: Role;
  messages: Array<{ role: string; content: string }>;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
  isLoading: boolean;
  isCollapsed?: boolean;
};

export function SuggestionsWidget({ 
  selectedRole,
  messages,
  onSuggestionClick,
  className,
  isLoading: isChatLoading,
  isCollapsed
}: SuggestionsWidgetProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const getContextualSuggestions = async () => {
      if (!selectedRole || messages.length === 0) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        // Get the last 3 user messages and their first corresponding assistant responses
        const relevantMessages = [];
        const userMessages = messages
          .filter(m => m.role === 'user')
          .slice(-3); // Get last 3 user messages

        for (const userMsg of userMessages) {
          // Find the user message index
          const userIndex = messages.findIndex(m => m === userMsg);
          // Add the user message
          relevantMessages.push(userMsg);
          // Find the first assistant response after this user message
          const assistantResponse = messages
            .slice(userIndex + 1)
            .find(m => m.role === 'assistant');
          if (assistantResponse) {
            relevantMessages.push(assistantResponse);
          }
        }
        
        const response = await fetch('/api/contextual-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: selectedRole,
            messages: relevantMessages
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    if (!isChatLoading) {
      const timeoutId = setTimeout(getContextualSuggestions, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedRole, messages, isChatLoading]);

  if (!selectedRole || isCollapsed) {
    return null;
  }

  return (
    <div className={`${className} flex-shrink flex-grow-0 basis-full overflow-hidden`}>
      <div className="px-4 py-2 flex items-center gap-2 overflow-hidden">
        <h2 className="text-base font-medium truncate flex-shrink">Suggestions</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 flex-shrink-0">
                <HelpCircle className="h-4 w-4 text-gray-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click a suggestion to quickly ask a relevant question</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="px-2 space-y-1.5 max-h-[300px] overflow-y-auto overflow-x-hidden">
        {isLoadingSuggestions ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))
        ) : (suggestions?.length ?? 0) > 0 ? (
          (suggestions || []).map((suggestion, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="inline-flex whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground text-left border rounded-xl px-4 py-3.5 text-xs flex-1 gap-1 w-full h-auto justify-start items-start"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (isChatLoading) return; // Don't process if currently streaming
                      
                      onSuggestionClick(suggestion.text);
                      
                      // Poll until input value is updated
                      const maxAttempts = 50; // 5 seconds max
                      let attempts = 0;
                      
                      while (attempts < maxAttempts) {
                        const input = document.querySelector('.multimodal-input') as HTMLTextAreaElement;
                        if (input?.value === suggestion.text) {
                          const submitButton = document.querySelector('.btn-submit-prompt');
                          if (submitButton instanceof HTMLButtonElement) {
                            submitButton.click();
                          }
                          break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms between checks
                        attempts++;
                      }
                    }}
                  >
                    <div className="w-full text-left">
                      {suggestion.text}
                    </div>
                  </Button>
                </TooltipTrigger>
                {suggestion.description && (
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p>{suggestion.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 truncate">
            No suggestions available
          </div>
        )}
      </div>
    </div>
  );
} 