'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

export type Role = {
  id: string;
  name: string;
  icon: string;
  description?: string;
};

type RolesSidebarProps = {
  roles: Role[];
  selectedRole?: Role;
  onRoleSelect: (role: Role) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function RolesSidebar({ roles, selectedRole, onRoleSelect, onCollapsedChange }: RolesSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleRoleSelect = (role: Role) => {
    const prevRole = selectedRole;
    onRoleSelect(role);
    
    // Dispatch custom event for role change
    const event = new CustomEvent('roleChange', {
      detail: {
        previousRole: prevRole,
        newRole: role
      }
    });
    window.dispatchEvent(event);
  };

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  return (
    <div 
      className={cn(
        "flex flex-col border-l border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <button
        onClick={() => handleCollapse(!isCollapsed)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 self-start rounded-lg m-2"
        aria-label={isCollapsed ? "Expand roles sidebar" : "Collapse roles sidebar"}
      >
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "hidden" : "")}>
        <div className="px-4 py-2 flex items-center gap-2">
          <h2 className="text-base font-medium">Roles</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select your role to personalize the chat experience</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="px-2 space-y-1.5 max-h-[300px] overflow-y-auto">
          {roles.map((role) => (
            <TooltipProvider key={role.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleRoleSelect(role)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm",
                      selectedRole?.id === role.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-lg" role="img" aria-label={role.name}>
                      {role.icon}
                    </span>
                    <span className="flex-1">{role.name}</span>
                  </button>
                </TooltipTrigger>
                {role.description && (
                  <TooltipContent side="right" className="max-w-[200px]">
                    <p>{role.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
} 