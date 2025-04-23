"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Create context with default empty values
const VoterListContext = createContext<any>({});

// Hook to use the context
export const useVoterListContext = () => useContext(VoterListContext);

// Provider component
export const VoterListProvider = ({ 
  children 
}: { 
  children: ReactNode 
}) => {
  return (
    <VoterListContext.Provider value={{}}>
      {children}
    </VoterListContext.Provider>
  );
}; 