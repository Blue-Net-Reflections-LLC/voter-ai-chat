"use client";

import React from "react";
import FilterPanel from "./components/FilterPanel";
import ResultsPanel from "./components/ResultsPanel";
import { useVoterList } from "./hooks/useVoterList";

export default function VoterListPage() {
  const {
    filters,
    residenceAddressFilters,
    pagination,
    sort,
    voters,
    isLoading,
    updateFilter,
    updateResidenceAddressFilter,
    clearAllFilters,
    updatePage,
    updatePageSize,
    updateSort,
    hasActiveFilters
  } = useVoterList();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background px-4 py-2 gap-6">
      {/* Filter Panel (Sidebar on larger screens) */}
      <FilterPanel
        filters={filters}
        residenceAddressFilters={residenceAddressFilters}
        updateFilter={updateFilter}
        updateResidenceAddressFilter={updateResidenceAddressFilter}
        clearAllFilters={clearAllFilters}
      />

      {/* Results Area */}
      <div className="flex-1 flex flex-col gap-4">
        <ResultsPanel
          voters={voters}
          pagination={pagination}
          sort={sort}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          onPageChange={updatePage}
          onPageSizeChange={updatePageSize}
          onSort={updateSort}
          onClearFilters={clearAllFilters}
        />
      </div>
    </div>
  );
} 