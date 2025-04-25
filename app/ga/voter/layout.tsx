import React from "react";
import { Metadata } from 'next';
import VoterHeader from "./VoterHeader";
import { Toaster } from "@/components/ui/toaster";
import { VoterFilterProvider } from './VoterFilterProvider';
import FilterPanel from './list/components/FilterPanel';
import TabNavigation from "./TabNavigation";
import { VoterListProvider } from "./VoterListContext";

export const metadata: Metadata = {
  title: 'Voter List | Georgia Voter Registry',
  description: 'View and manage the list of registered voters in Georgia',
};

// Estimate combined height of fixed elements (Header + Nav)
const FIXED_HEADER_NAV_HEIGHT = '100px'; // User specified height

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Fixed Header and Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-sm">
        <VoterHeader />
        <TabNavigation />
      </div>

      {/* Apply padding-top via inline style */}
      <div className={`w-full h-screen flex flex-col`} style={{ paddingTop: FIXED_HEADER_NAV_HEIGHT }}>
        <VoterListProvider>
          <VoterFilterProvider>
            {/* Flex container for sidebar and main content */}
            <div className="flex flex-1 w-full min-h-0">
              {/* Fixed Sidebar - Ensure top style is correctly applied */}
              <aside 
                className="w-1/4 min-w-[300px] max-w-[400px] border-r bg-background flex-shrink-0 fixed left-0 bottom-0"
                style={{ top: FIXED_HEADER_NAV_HEIGHT }}
              >
                <div className="h-full overflow-y-auto pb-4"> {/* Make inner div scrollable */}
                  <FilterPanel />
                </div>
              </aside>
              {/* Scrollable Main content area - Ensure height and margin are correct */}
              <main 
                className="flex-1 overflow-y-auto ml-[25%] w-[75%]"
                style={{ height: `calc(100vh - ${FIXED_HEADER_NAV_HEIGHT})` }}
              >
                {children}
              </main>
            </div>
            <Toaster />
          </VoterFilterProvider>
        </VoterListProvider>
      </div>
    </>
  );
} 