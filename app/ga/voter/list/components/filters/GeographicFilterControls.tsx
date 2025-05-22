import React from "react";
import { ResidenceAddressFilter } from '../../ResidenceAddressFilter'; // Adjusted path
import { GeographicFilterControlsProps, ResidenceAddressFilterState } from "./types";

export function GeographicFilterControls({
  residenceAddressFilters,
  updateResidenceAddressFilter,
  addAddressFilter,
  removeAddressFilter,
  clearAllAddressFilters
}: GeographicFilterControlsProps) {
  return (
    <>
      <ResidenceAddressFilter
        addressFilters={residenceAddressFilters}
        addAddressFilter={addAddressFilter}
        removeAddressFilter={removeAddressFilter}
        clearAllAddressFilters={clearAllAddressFilters}
        updateAddressFilter={(id, field, value) => {
          updateResidenceAddressFilter(id, field as keyof Omit<ResidenceAddressFilterState, 'id'>, value);
        }}
      />
    </>
  );
} 