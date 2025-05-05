'use client';

import React, { useState } from 'react';
import { DemographicRatioChart } from '@/components/charts/DemographicRatioChart';
import { VoterCountsChart } from '@/components/charts/VoterCountsChart';
import { VoterCombinationCountsChart } from '@/components/charts/VoterCombinationCountsChart';
import { TabNavigation } from '@/components/charts/TabNavigation';
import { useVoterFilterContext } from '@/app/ga/voter/VoterFilterProvider';

// Define chart types for the tab navigation
const chartTypes = [
  { value: 'demographicRatioOverTime', label: 'Demographic Ratio' },
  { value: 'voterCountsOverTime', label: 'Voter Counts' },
  { value: 'voterCombinationCounts', label: 'Combination Counts' },
  // Future chart types can be added here
];

export default function ChartsPage() {
  const { hasActiveFilters } = useVoterFilterContext();
  const [activeChart, setActiveChart] = useState(chartTypes[0].value);

  return (
    <div className="container mx-auto p-4">
      {/* Chart Type Navigation */}
      <div className="mb-6">
        <TabNavigation
          tabs={chartTypes}
          activeTab={activeChart}
          onTabChange={setActiveChart}
        />
      </div>

      {/* Render the active chart */}
      {activeChart === 'demographicRatioOverTime' && <DemographicRatioChart />}
      {activeChart === 'voterCountsOverTime' && <VoterCountsChart />}
      {activeChart === 'voterCombinationCounts' && <VoterCombinationCountsChart />}
      
      {/* Add more chart components as they are implemented */}
    </div>
  );
} 