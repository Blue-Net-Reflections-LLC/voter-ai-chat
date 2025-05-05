'use client';

import React, { useState } from 'react';
import { DemographicRatioChart } from '@/components/charts/DemographicRatioChart';
import { VoterCountsChart } from '@/components/charts/VoterCountsChart';
import { TabNavigation } from '@/components/charts/TabNavigation';
import { useVoterFilterContext } from '@/app/ga/voter/VoterFilterProvider';

// Define chart types for the tab navigation
const chartTypes = [
  { value: 'demographicRatioOverTime', label: 'Demographic Ratio' },
  { value: 'voterCountsOverTime', label: 'Voter Counts' },
  // Future chart types can be added here
];

export default function ChartsPage() {
  const { hasActiveFilters } = useVoterFilterContext();
  const [activeChart, setActiveChart] = useState(chartTypes[0].value);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Voter Analytics Charts</h1>
        <p className="text-gray-600">
          Visualize voter data and demographics over time
          {hasActiveFilters() && (
            <span className="ml-1 text-amber-600 font-medium">
              (Filtered data based on current selection)
            </span>
          )}
        </p>
      </div>

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
      
      {/* Add more chart components as they are implemented */}
    </div>
  );
} 