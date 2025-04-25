"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VotingInfoSection from "./VotingInfoSection";
import DistrictsSection from "./DistrictsSection";
import StatsSection from "./StatsSection";

export default function StatsDashboardPage() {
  return (
    <div className="w-full h-full flex flex-col gap-6 p-2 md:p-6 xl:p-8">
      <StatsSection title="VOTER INFO">
        <VotingInfoSection />
      </StatsSection>
      <StatsSection title="DISTRICTS">
        <DistrictsSection />
      </StatsSection>
      <StatsSection title="DEMOGRAPHICS">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Demographics...</span>
        </div>
      </StatsSection>
      <StatsSection title="VOTING HISTORY">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Voting History...</span>
        </div>
      </StatsSection>
      <StatsSection title="CENSUS">
        <div className="flex flex-col items-center justify-center min-h-[80px] text-muted-foreground text-sm">
          <span className="animate-pulse">Loading Census...</span>
        </div>
      </StatsSection>
    </div>
  );
} 