"use client";
import React, { createContext, useContext, useState } from "react";
import { PaginationState, Voter } from "./list/types";

interface VoterListContextType {
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  voters: Voter[];
  setVoters: React.Dispatch<React.SetStateAction<Voter[]>>;
}

const VoterListContext = createContext<VoterListContextType | undefined>(undefined);

export const VoterListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 25,
    totalItems: 0,
  });
  const [voters, setVoters] = useState<Voter[]>([]);

  return (
    <VoterListContext.Provider value={{ pagination, setPagination, voters, setVoters }}>
      {children}
    </VoterListContext.Provider>
  );
};

export function useVoterListContext() {
  const ctx = useContext(VoterListContext);
  if (!ctx) throw new Error("useVoterListContext must be used within a VoterListProvider");
  return ctx;
} 