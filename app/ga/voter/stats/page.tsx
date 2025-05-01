"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VotingInfoSection from "./VotingInfoSection";
import DistrictsSection from "./DistrictsSection";
import StatsSection from "./StatsSection";
import DemographicsSection from "./DemographicsSection";
import VotingHistorySection from "./VotingHistorySection";
// import CensusSection from "./CensusSection";

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
        <DemographicsSection />
      </StatsSection>
      <StatsSection title="VOTING HISTORY">
        <VotingHistorySection />
      </StatsSection>
      <StatsSection title="CENSUS">
        <div />
      </StatsSection>
    </div>
  );
} 