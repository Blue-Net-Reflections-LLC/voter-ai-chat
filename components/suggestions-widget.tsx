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
};

export function SuggestionsWidget({ 
  selectedRole,
  messages,
  onSuggestionClick,
  className,
  isLoading: isChatLoading
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
        const recentMessages = messages.slice(-3);
        
        const response = await fetch('/api/contextual-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: selectedRole,
            messages: recentMessages
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

  if (!selectedRole) {
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
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-right text-sm font-normal h-auto py-1.5 px-3 whitespace-normal hover:bg-gray-100 dark:hover:bg-gray-800 overflow-hidden"
                    onClick={(e) => {
                      e.preventDefault();
                      onSuggestionClick(suggestion.text);
                      const submitButton = document.querySelector('.btn-submit-prompt');
                      if (submitButton instanceof HTMLButtonElement) {
                        submitButton.click();
                      }
                    }}
                  >
                    <div className="w-full text-right truncate">
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