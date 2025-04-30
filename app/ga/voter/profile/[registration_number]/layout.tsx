import React, { Suspense } from "react";
import { Metadata } from 'next';
import VoterHeader from "../../VoterHeader";
import { Toaster } from "@/components/ui/toaster";
import TabNavigation from "../../TabNavigation";

export const metadata: Metadata = {
  title: 'Voter Profile | Georgia Voter Registry',
  description: 'Detailed information about a registered voter in Georgia',
};

// Estimate combined height of fixed elements (Header + Nav)
const FIXED_HEADER_NAV_HEIGHT = '100px';

export default function VoterProfileLayout({
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

      {/* Main content area, only this should scroll */}
      <main 
        className="w-full px-6 pt-4"
        style={{
          paddingTop: FIXED_HEADER_NAV_HEIGHT,
          minHeight: `calc(100vh - ${FIXED_HEADER_NAV_HEIGHT})`,
          overflowY: 'auto',
        }}
      >
        <Suspense>{children}</Suspense>
        <Toaster />
      </main>
    </>
  );
} 