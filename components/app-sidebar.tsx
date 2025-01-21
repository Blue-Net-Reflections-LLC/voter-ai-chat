'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { BetterTooltip } from '@/components/ui/tooltip';
import Link from 'next/link';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { cn } from '@/lib/utils';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { open, setOpen } = useSidebar();

  return (
    <>
      <Sidebar className={cn(
        "fixed left-0 top-16 flex flex-col border-r border-gray-200 dark:border-gray-800 h-[calc(100dvh-4rem)] bg-background/50 backdrop-blur-sm z-40 transition-all duration-300",
        open ? "w-64" : "w-0"
      )}>
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center">
              <Link
                href="/"
                onClick={() => {
                  setOpen(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                  New Chat
                </span>
              </Link>
              <BetterTooltip content="New Chat" align="start">
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpen(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </BetterTooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="-mx-2">
            <SidebarHistory user={user} />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-0 -mx-2">
          {user && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarUserNav user={user} />
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarFooter>
      </Sidebar>
      <div
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setOpen(!open);
          }
        }}
        className={cn(
          "fixed top-[72px] p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-300 z-40 cursor-pointer",
          open ? "left-64" : "left-0"
        )}
        role="button"
        tabIndex={0}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        <SidebarToggle />
      </div>
    </>
  );
}
