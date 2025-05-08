"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { List, BarChart2, Map, PieChart, Landmark, Menu, X } from "lucide-react";

const tabs = [
  {
    label: "List",
    href: "/ga/voter/list",
    icon: List,
    enabled: true,
  },
  {
    label: "Stats",
    href: "/ga/voter/stats",
    icon: BarChart2,
    enabled: true,
  },
  {
    label: "Maps",
    href: "/ga/voter/map",
    icon: Map,
    enabled: true,
  },
  {
    label: "Charts",
    href: "/ga/voter/charts",
    icon: PieChart,
    enabled: true,
  },
  {
    label: "Census",
    href: "#",
    icon: Landmark,
    enabled: false,
  },
];

const VoterHeader: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="border-b bg-background sticky top-0 z-[10002] max-h-[60px]">
      <div className="flex h-[60px] items-center px-6">
        {/* Left section - Voter AI */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="font-semibold text-base leading-tight mr-1">
            Voter AI
          </Link>
          <Link href="/ga/voter" className="flex items-center text-xs text-muted-foreground ml-2 hover:text-primary transition-colors">
            <span className="mr-1">📍</span>
            <span>GA</span>
          </Link>
        </div>
        
        {/* Spacer that pushes the tabs to the right */}
        <div className="flex-1"></div>
        
        {/* Mobile menu button - only visible on mobile */}
        <button
          className="md:hidden flex items-center justify-center h-8 w-8 mr-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
        
        {/* Desktop tabs - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar mr-4">
          {tabs.map((tab) => {
            const isActive = tab.enabled && pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return tab.enabled ? (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="w-5 h-4 md:w-4 md:h-4 flex-shrink-0" />
                <span className="md:inline">{tab.label}</span>
              </Link>
            ) : (
              <span
                key={tab.label}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed whitespace-nowrap"
              >
                <Icon className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" />
                <span className="md:inline">{tab.label}</span>
              </span>
            );
          })}
        </div>
        
        {/* Right section - profile only */}
        <div className="flex-shrink-0 flex items-center">
          {/* Placeholder for UserProfile */}
          <div className="h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center">
             <span className="text-xs">👤</span> {/* Simple placeholder icon */}
          </div>
        </div>
      </div>
      
      {/* Mobile menu - slide out, only visible when menu is open */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[10000] bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-[60px] right-0 w-64 h-[calc(100vh-60px)] bg-background shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-2">
              {tabs.map((tab) => {
                const isActive = tab.enabled && pathname.startsWith(tab.href);
                const Icon = tab.icon;
                return tab.enabled ? (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors
                      ${isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </Link>
                ) : (
                  <span
                    key={tab.label}
                    className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default VoterHeader; 