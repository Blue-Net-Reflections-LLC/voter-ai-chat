"use client";

import React, { Suspense } from "react";
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
  );
}

export default function VoterListPage() {
  return (
    <Suspense>
      <VoterListContent />
    </Suspense>
  );
} 