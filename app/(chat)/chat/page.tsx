'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// TODO: Move to a shared config/utility
const states = [
  { name: 'Georgia', abbr: 'GA', icon: '/images/states/ga.svg', isActive: true },
  { name: 'Florida', abbr: 'FL', icon: '/images/states/fl.svg', isActive: false },
  { name: 'Alabama', abbr: 'AL', icon: '/images/states/al.svg', isActive: false },
  { name: 'South Carolina', abbr: 'SC', icon: '/images/states/sc.svg', isActive: false },
  // Add other states as needed
];

// Note: This page component will render within the ChatLayout
// It replaces the previous placeholder ChatBasePage.
export default function ChatStateSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { update: updateSession } = useSession();
  const [selectedState, setSelectedState] = useState<string | null>('GA'); // Default to active state
  const [isLoading, setIsLoading] = useState(false);

  const handleStateClick = (abbr: string, isActive: boolean) => {
    if (isActive) {
      setSelectedState(abbr);
    } else {
      toast({
        title: "Coming Soon",
        description: `Support for ${states.find(s=> s.abbr === abbr)?.name || abbr} is planned. Contact sales@voterai.chat for more info.`,
      });
    }
  };

  const handleConfirm = async () => {
    if (!selectedState) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedState: selectedState }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save selected state');
      }

      toast({
        title: "State Selected",
        description: `Successfully set state to ${selectedState}. Redirecting...`,
      });

      // Force navigation via full page reload using window.location
      const targetUrl = `/${selectedState.toLowerCase()}/chat`;
      console.log(`[handleConfirm] Assigning location to: ${targetUrl}`);
      window.location.assign(targetUrl); 

    } catch (error: any) {
      console.error('Failed to update state:', error);
      toast({
        title: "Error",
        description: error.message || 'Could not save selected state. Please try again.',
        variant: "destructive",
      });
      setIsLoading(false); // Re-enable button on error
    }
  };

  // Render the selection UI within the chat layout's structure
  // Use a Card component for presentation, adjust styling as needed
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Select Your State</CardTitle>
          <CardDescription>
            Choose the state for which you want to access VoterAI information. Currently, only Georgia is supported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 py-4">
            {states.map((state) => (
              <button
                key={state.abbr}
                onClick={() => handleStateClick(state.abbr, state.isActive)}
                disabled={!state.isActive}
                className={cn(
                  'flex flex-col items-center justify-center p-3 border rounded-lg text-center transition-colors duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  state.isActive
                    ? 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                    : 'cursor-not-allowed opacity-50 bg-muted',
                  selectedState === state.abbr && state.isActive ? 'ring-2 ring-primary ring-offset-2' : ''
                )}
              >
                <Image 
                  src={state.icon} 
                  alt={`${state.name} flag icon`} 
                  width={40} 
                  height={40} 
                  className="mb-2"
                />
                <span className="text-sm font-medium truncate w-full">{state.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !selectedState || !states.find(s => s.abbr === selectedState)?.isActive}
          >
            {isLoading ? 'Saving...' : 'Confirm'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 