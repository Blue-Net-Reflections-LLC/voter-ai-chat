'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Tab = {
  value: string;
  label: string;
};

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className 
}: TabNavigationProps) {
  return (
    <div className={cn("flex border-b", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === tab.value
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
} 