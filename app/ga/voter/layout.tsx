'use client'; // Make this layout a client component

import React, { Suspense } from "react";
import { Metadata } from 'next';
import VoterHeader from "./VoterHeader";
import { Toaster } from "@/components/ui/toaster";
import { VoterFilterProvider } from './VoterFilterProvider';
import FilterPanel from './list/components/FilterPanel';
import TabNavigation from "./TabNavigation";
import { VoterListProvider } from "./VoterListContext";
import { MapStateProvider } from '@/context/MapStateContext';
import { usePathname } from 'next/navigation';

// Note: Metadata export might not work reliably in a 'use client' layout.
// Consider moving it to a parent server component layout if needed.
/* export const metadata: Metadata = {
  title: 'Voter List | Georgia Voter Registry',
  description: 'View and manage the list of registered voters in Georgia',
}; */

// Estimate combined height of fixed elements (Header + Nav)
const FIXED_HEADER_NAV_HEIGHT = '100px'; // User specified height

// Define paths where the FilterPanel should be visible
const filterPanelVisiblePaths = [
  '/ga/voter/list',
  '/ga/voter/stats',
  '/ga/voter/map',
  '/ga/voter/charts'
];

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get pathname using the hook
  // Determine if the filter panel should be shown based on the current path
  const showFilterPanel = filterPanelVisiblePaths.includes(pathname);

  return (
    // Wrap EVERYTHING in the providers
    <Suspense> { /* Suspense might need to be outside if providers fetch data */}
      <VoterListProvider>
        <VoterFilterProvider>
          <MapStateProvider>
            <>
              {/* Fixed Header and Nav (Now inside providers) */}
              <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-sm">
                <VoterHeader />
                <TabNavigation /> { /* TabNavigation can now access VoterFilterContext */}
              </div>

              {/* Apply padding-top via inline style */}
              <div className={`w-full h-screen flex flex-col`} style={{ paddingTop: FIXED_HEADER_NAV_HEIGHT }}>
                 {/* Flex container for sidebar and main content */}
                <div className="flex flex-1 w-full min-h-0">
                  {/* Conditionally render sidebar based on allowed paths */}
                  {showFilterPanel && (
                    <div className="hidden md:block md:w-[280px] md:min-w-[280px] md:max-w-[320px] md:flex-shrink-0">
                      <FilterPanel />
                    </div>
                  )}
                  {/* Scrollable Main content area - Adjust for responsive layout */}
                  <main 
                    className="flex-1 overflow-y-auto w-full"
                    style={{ height: `calc(100vh - ${FIXED_HEADER_NAV_HEIGHT})` }}
                  >
                    {/* Only show FilterPanel on mobile at the top of the main content */}
                    {showFilterPanel && (
                      <div className="md:hidden">
                        <FilterPanel />
                      </div>
                    )}
                    {children}
                  </main>
                </div>
                <Toaster />
              </div>
            </>
          </MapStateProvider>
        </VoterFilterProvider>
      </VoterListProvider>
    </Suspense>
  );
} 