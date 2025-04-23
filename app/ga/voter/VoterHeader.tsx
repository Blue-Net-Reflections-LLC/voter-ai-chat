"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const VoterHeader: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: "Voter List", href: "/ga/voter/list" },
    { name: "Voter Profile", href: "/ga/voter/profile" },
  ];

  return (
    <header className="border-b bg-background sticky top-0 z-10 max-h-[60px]">
      <div className="flex h-[60px] items-center justify-between px-4 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Link href="/" className="font-semibold text-base leading-tight mr-1">
              Voter AI
            </Link>
            <div className="flex items-center text-xs text-muted-foreground ml-2">
              <span className="mr-1">📍</span>
              <span>GA</span>
            </div>
          </div>
          <nav className="flex items-center gap-3 ml-4">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors hover:text-primary px-2 py-1",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded bg-blue-800 flex items-center justify-center text-white text-xs font-bold">
            GA
          </div>
          <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs">👤</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default VoterHeader; 