"use client";

import React, { useEffect } from "react";
import StatsDashboardSection from "./StatsDashboardSection";

function StatsDashboardPage() {
  useEffect(() => {
    console.log('Horace: StatsDashboardPage mounted');
    return () => {
      console.log('Horace: StatsDashboardPage unmounted');
    }
  }, []);

  return (
    <div className="w-full h-full">
      <StatsDashboardSection />
    </div>
  );
}

// Wrap the component with React.memo to prevent unnecessary re-renders
export default React.memo(StatsDashboardPage); 