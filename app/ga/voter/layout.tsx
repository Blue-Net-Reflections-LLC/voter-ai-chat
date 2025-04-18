import React from "react";
import VoterHeader from "./VoterHeader";

export const metadata = {
  title: "Voter Registration and Management",
  description: "Access and manage voter registration data",
};

export default function VoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <VoterHeader />
      <main className="flex-1 bg-background pt-1">{children}</main>
    </div>
  );
} 