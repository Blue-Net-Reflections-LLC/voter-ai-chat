import React from "react";
import { Metadata } from 'next';
import VoterHeader from "./VoterHeader";

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
    <div className="h-screen flex flex-col">
      <VoterHeader />
      <main className="pt-1 flex-grow overflow-auto">
        {children}
      </main>
    </div>
  );
} 