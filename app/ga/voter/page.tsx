'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, BarChart2, Map, PieChart, Landmark } from "lucide-react";

// Define features for easy mapping
const features = [
  {
    title: "List",
    description: "Browse, sort, and filter the complete Georgia voter list.",
    href: "/ga/voter/list",
    icon: List,
    enabled: true,
    cta: "Go to List",
  },
  {
    title: "Stats",
    description: "View aggregate statistics and summaries based on current filters.",
    href: "/ga/voter/stats",
    icon: BarChart2,
    enabled: true,
    cta: "View Stats",
  },
  {
    title: "Maps",
    description: "Visualize voter data geographically based on selected filters.",
    href: "/ga/voter/map", // Assuming this is the correct path
    icon: Map,
    enabled: true,
    cta: "Explore Maps",
  },
  {
    title: "Charts",
    description: "Analyze demographic trends and participation over time.",
    href: "/ga/voter/charts", // Assuming this is the correct path
    icon: PieChart,
    enabled: true,
    cta: "Analyze Charts",
  },
  {
    title: "Census",
    description: "Explore integrated Census data related to voter demographics.",
    href: "#",
    icon: Landmark,
    enabled: false,
    cta: "Coming Soon",
  },
];

export default function VoterLandingPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-3">
          Georgia Voter AI Tools
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore registered voter data for Georgia. Analyze lists, view aggregate statistics, visualize maps, and examine charts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center gap-4 pb-4">
              <feature.icon className={`w-8 h-8 ${feature.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              {feature.enabled ? (
                <Link href={feature.href} passHref className="w-full">
                  <Button className="w-full" variant="default" asChild>
                    <span>{feature.cta}</span>
                  </Button>
                </Link>
              ) : (
                <Button className="w-full" variant="secondary" disabled>
                  {feature.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 