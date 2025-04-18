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
    <div className="h-[calc(100vh-60px)] flex flex-col">
      <div className="w-full flex flex-row space-x-4 py-2 h-full overflow-hidden">
        <div className="w-1/4 h-full overflow-hidden">
          <FilterPanel
            filters={filters}
            residenceAddressFilters={residenceAddressFilters}
            updateFilter={updateFilter}
            updateResidenceAddressFilter={updateResidenceAddressFilter}
            clearAllFilters={clearAllFilters}
          />
        </div>
        <div className="w-3/4 h-full overflow-hidden">
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
    </div>
  );
} 