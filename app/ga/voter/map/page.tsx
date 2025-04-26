'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the MapView component
const DynamicMapView = dynamic(
  () => import('@/components/ga/voter/map/MapView'),
  {
    ssr: false, // Important: MapView relies on browser APIs, disable SSR
    loading: () => <div className="h-full w-full flex items-center justify-center"><p>Loading Map...</p></div> // Optional loading indicator
  }
);

export default function VoterMapPage() {
  return (
    <div className="h-full w-full">
      {/* The dynamically loaded map component will render here */}
      <DynamicMapView />
    </div>
  );
} 