"use client";
import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function StatsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  return (
    <Card className="w-full mb-4">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none py-1.5 px-4"
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <CardTitle className="text-sm capitalize">{title}</CardTitle>
        <Button variant="ghost" size="icon" tabIndex={-1} aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}>
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </Button>
      </CardHeader>
      <CardContent className={cn(isCollapsed && "hidden")}>{children}</CardContent>
    </Card>
  );
}

export default StatsSection; 