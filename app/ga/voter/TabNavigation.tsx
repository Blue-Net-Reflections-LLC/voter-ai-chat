"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, BarChart2, Map, PieChart, Landmark } from "lucide-react";

const tabs = [
  {
    label: "Voter List",
    href: "/ga/voter/list",
    icon: List,
    enabled: true,
  },
  {
    label: "Stats/Aggregate",
    href: "/ga/voter/stats",
    icon: BarChart2,
    enabled: true,
  },
  {
    label: "Maps",
    href: "#",
    icon: Map,
    enabled: false,
  },
  {
    label: "Charts",
    href: "#",
    icon: PieChart,
    enabled: false,
  },
  {
    label: "Census Tract",
    href: "#",
    icon: Landmark,
    enabled: false,
  },
];

export default function TabNavigation() {
  const pathname = usePathname();
  return (
    <nav className="w-full border-b bg-background px-4 pt-2 pb-1 flex gap-2 justify-end">
      {tabs.map((tab) => {
        const isActive = tab.enabled && pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return tab.enabled ? (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors
              ${isActive ? "bg-red-600 text-white" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon className="w-4 h-4 mr-1" />
            {tab.label}
          </Link>
        ) : (
          <span
            key={tab.label}
            className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
          >
            <Icon className="w-4 h-4 mr-1" />
            {tab.label}
          </span>
        );
      })}
    </nav>
  );
} 