"use client";

import React, { Suspense } from "react";
import ResultsPanel from "./components/ResultsPanel";
import { useVoterList } from "./hooks/useVoterList";

function VoterListContent() {
  const {
    pagination,
    sort,
    voters,
    isLoading,
    clearAllFilters,
    updatePage,
    updatePageSize,
    updateSort,
    hasActiveFilters,
    currentQueryParams
  } = useVoterList();

  return (
    <div className="px-4 py-2 md:pl-0 md:pr-4 md:py-2 w-full">
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
      />
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