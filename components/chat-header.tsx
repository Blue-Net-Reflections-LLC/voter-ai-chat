'use client';
import { ThemeToggle } from "@/components/theme-toggle";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { ModelSelector } from '@/components/model-selector';
import { Button } from './ui/button';
import { ArrowRight, Edit3 } from 'lucide-react';
// import { useStateSelection } from '@/app/(chat)/layout';

// Remove state utility functions
// const stateNames: { [key: string]: string } = { ... };
// const getStateName = (abbr: string | null | undefined): string => { ... };

export function ChatHeader({ selectedModelId }: { selectedModelId: string }) {
  const pathname = usePathname();
  const isChatPage = pathname.includes('/chat'); 
  // Remove context usage
  // const { openStateSelection, selectedStateAbbr } = useStateSelection(); 
  // const currentStateName = getStateName(selectedStateAbbr);

  // Determine state from path if possible (basic example)
  const pathSegments = pathname.split('/');
  const stateAbbrFromPath = pathSegments.length >= 2 && pathSegments[1].length === 2 ? pathSegments[1].toUpperCase() : null;
  const headerTitle = stateAbbrFromPath ? `VoterAI Chat - ${stateAbbrFromPath}` : 'VoterAI Chat'; // Simple display

  return (
    <header className="flex flex-row justify-between items-center px-6 py-3">
      <h2 className="text-lg font-semibold truncate">
        {headerTitle} {/* Display derived title */}
      </h2>
      <div className="flex flex-row items-center gap-4">
        {/* Remove Change State Button */}
        {/* {isChatPage && selectedStateAbbr && ( ... )} */}
        
        {/* Keep Model Selector logic (commented) */}
        {/* {isChatPage && <ModelSelector selectedModelId={selectedModelId} />}  */}
        
        {/* Keep Share button */}
        <Button
          variant="secondary"
          size="sm"
          className="flex flex-row items-center gap-1.5"
          disabled
        >
          <ArrowRight className="h-4 w-4" />
          Share
        </Button>
      </div>
    </header>
  );
}
