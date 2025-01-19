'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
};

export function RolesSidebar({ roles, selectedRole, onRoleSelect }: RolesSidebarProps) {
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

  return (
    <div 
      className={cn(
        "flex flex-col border-l border-gray-200 dark:border-gray-800 transition-all duration-300",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 self-start rounded-lg m-2"
        aria-label={isCollapsed ? "Expand roles sidebar" : "Collapse roles sidebar"}
      >
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "hidden" : "")}>
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold">Roles</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select your role to personalize the chat experience
          </p>
        </div>

        <div className="px-2">
          {roles.map((role) => (
            <TooltipProvider key={role.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleRoleSelect(role)}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-2 rounded-lg text-left",
                      selectedRole?.id === role.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="text-xl" role="img" aria-label={role.name}>
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