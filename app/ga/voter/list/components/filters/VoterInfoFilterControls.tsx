import React, { useState, useEffect } from "react";
import { MultiSelect } from "../MultiSelect";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ensureStringArray } from "./utils";
import { VoterInfoFilterControlsProps, OptionType } from "./types";

export function VoterInfoFilterControls({
  filters,
  updateFilter,
  isLoading,
  statuses,
  statusReasons,
  parties
}: VoterInfoFilterControlsProps) {
  const [firstNameInput, setFirstNameInput] = useState(filters.firstName || '');
  const [lastNameInput, setLastNameInput] = useState(filters.lastName || '');

  useEffect(() => {
    setFirstNameInput(filters.firstName || '');
    setLastNameInput(filters.lastName || '');
  }, [filters.firstName, filters.lastName]);

  return (
    <>
      <MultiSelect
        label="Status"
        options={statuses as OptionType[]}
        value={ensureStringArray(filters.status)}
        setValue={(value) => updateFilter('status', value)}
        isLoading={isLoading}
        compact={true}
      />
      <Separator className="my-3" />
      <MultiSelect
        label="Inactive Status Reasons"
        options={statusReasons as OptionType[]}
        value={ensureStringArray(filters.statusReason)}
        setValue={(value) => updateFilter('statusReason', value)}
        isLoading={isLoading}
        compact={true}
      />
      <Separator className="my-3" />
      <div>
        <label className="text-xs font-medium">First Name</label>
        <Input
          placeholder="Enter first name..."
          className="h-8 text-xs"
          value={firstNameInput}
          onChange={(e) => setFirstNameInput(e.target.value)}
          onBlur={() => updateFilter('firstName', firstNameInput.trim())}
        />
      </div>
      <div>
        <label className="text-xs font-medium">Last Name</label>
        <Input
          placeholder="Enter last name..."
          className="h-8 text-xs"
          value={lastNameInput}
          onChange={(e) => setLastNameInput(e.target.value)}
          onBlur={() => updateFilter('lastName', lastNameInput.trim())}
        />
        <Button
          size="sm"
          className="mt-2"
          onClick={() => {
            updateFilter('firstName', firstNameInput.trim());
            updateFilter('lastName', lastNameInput.trim());
          }}
        >
          Apply Name Filter
        </Button>
      </div>
      <Separator className="my-3" />
      <MultiSelect
        label="Registered Voter Party"
        options={parties as OptionType[]}
        value={ensureStringArray(filters.party)}
        setValue={(value) => updateFilter('party', value)}
        isLoading={isLoading}
        compact={true}
      />
    </>
  );
} 