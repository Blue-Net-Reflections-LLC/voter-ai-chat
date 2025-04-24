"use client";

import React, { Suspense } from "react";
import FilterPanel from "./components/FilterPanel";
import ResultsPanel from "./components/ResultsPanel";
import { useVoterList } from "./hooks/useVoterList";

function VoterListContent() {
  const {
    filters,
    residenceAddressFilters,
    pagination,
    sort,
    voters,
    isLoading,
    updateFilter,
    updateResidenceAddressFilter,
    setResidenceAddressFilters,
    clearAllFilters,
    updatePage,
    updatePageSize,
    updateSort,
    hasActiveFilters,
    buildQueryParams
  } = useVoterList();

  const currentQueryParams = buildQueryParams().toString();

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      <div className="w-full flex flex-row space-x-4 py-2 h-full overflow-hidden">
        <div className="w-1/4 h-full overflow-hidden">
          <FilterPanel
            filters={filters}
            residenceAddressFilters={residenceAddressFilters}
            updateFilter={updateFilter}
            updateResidenceAddressFilter={updateResidenceAddressFilter}
            setResidenceAddressFilters={setResidenceAddressFilters}
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
            currentQueryParams={currentQueryParams}
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

export default function VoterListPage() {
  return (
    <Suspense>
      <VoterListContent />
    </Suspense>
  );
} 