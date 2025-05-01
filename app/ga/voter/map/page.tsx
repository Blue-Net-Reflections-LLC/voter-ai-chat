'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useMapState } from '@/context/MapStateContext';

// Dynamically import the NEW Mapbox MapView component
const DynamicMapboxMapView = dynamic(
  () => import('@/components/ga/voter/map/MapboxMapView'),
  {
    ssr: false, // Important: MapView relies on browser APIs, disable SSR
    loading: () => <div className="h-full w-full flex items-center justify-center"><p>Initializing Map...</p></div>
  }
);

// Simple Progress Bar Component (can be moved to its own file)
const LoadingProgressBar = () => (
  <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-600 animate-pulse z-10">
    {/* You could add more complex animation/styles here */}
  </div>
);

export default function VoterMapPage() {
  const { isLoading } = useMapState();

  return (
    <div className="relative h-full w-full">
      {isLoading && <LoadingProgressBar />}
      <DynamicMapboxMapView />
    </div>
  );
} 