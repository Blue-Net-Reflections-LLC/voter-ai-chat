import React from "react";
import { Metadata } from 'next';
import VoterHeader from "./VoterHeader";
import { Toaster } from "@/components/ui/toaster";
import { VoterFilterProvider } from './VoterFilterProvider';
import FilterPanel from './list/components/FilterPanel';
import TabNavigation from "./TabNavigation";

export const metadata: Metadata = {
  title: 'Voter List | Georgia Voter Registry',
  description: 'View and manage the list of registered voters in Georgia',
};

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <VoterHeader />
      <TabNavigation />
      <VoterFilterProvider>
        <div className="flex flex-col w-full min-h-0">
          <div className="flex flex-1 w-full min-h-0">
            {/* Sidebar: Filter Panel */}
            <aside className="w-1/4 min-w-[300px] max-w-[400px] h-[calc(100vh-101px)] border-r bg-background flex-shrink-0">
              <div className="p0 h-full overflow-auto">
                <FilterPanel />
              </div>
            </aside>
            {/* Main content area: List or Stats view */}
            <main className="flex-1 h-[calc(100vh-101px)] min-h-0">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </VoterFilterProvider>
    </>
  );
} 