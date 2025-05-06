import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  filterCount?: number; // Number of active filters in this section
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  children,
  defaultOpen = true,
  className = "",
  filterCount = 0
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("", className)}>
      <button 
        className="flex justify-between items-center w-full py-3 px-1 hover:bg-muted/50 rounded-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center">
          {filterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full mr-2">
              {filterCount}
            </span>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <div className={cn(
        "pt-1 pl-2 space-y-3 transition-all duration-200 overflow-hidden",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection; 