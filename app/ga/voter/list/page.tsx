"use client";

import React from "react";
import ResultsPanel from "./components/ResultsPanel";
import { useVoterList } from "./hooks/useVoterList";

export default function VoterListPage() {
  const {
    pagination,
    sort,
    voters,
    isLoading,
    hasFetchedOnce,
    clearAllFilters,
    updatePage,
    updatePageSize,
    updateSort,
    hasActiveFilters,
    currentQueryParams
  } = useVoterList();

  return (
    <div className="w-full h-full">
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
        hasFetchedOnce={hasFetchedOnce}
      />
    </div>
  );
} 