import React from "react";
import { Metadata } from 'next';
import VoterHeader from "./VoterHeader";
import { Toaster } from "@/components/ui/toaster";
import { VoterFilterProvider } from './VoterFilterProvider';
import FilterPanel from './list/components/FilterPanel';

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
      <VoterFilterProvider>
        <div className="flex flex-col w-full min-h-0">
          <div className="flex flex-1 w-full min-h-0">
            {/* Sidebar: Filter Panel and Tab Navigation */}
            <aside className="w-1/4 min-w-[300px] max-w-[400px] h-[calc(100vh-61px)] border-r bg-background flex-shrink-0">
              {/* TODO: Tab Navigation (List/Stats) */}
              <div className="border-b">
                {/* Tab navigation goes here */}
                <div className="flex gap-2">
                  {/* Example: <TabLink href="/ga/voter/list">Voter List</TabLink> */}
                  {/* Example: <TabLink href="/ga/voter/stats">Stats/Aggregate</TabLink> */}
                </div>
              </div>
              {/* Filter Panel */}
              <div className="p0 h-full overflow-auto">
                <FilterPanel />
              </div>
            </aside>
            {/* Main content area: List or Stats view */}
            <main className="flex-1 h-[calc(100vh-60px)] min-h-0">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </VoterFilterProvider>
    </>
  );
} 