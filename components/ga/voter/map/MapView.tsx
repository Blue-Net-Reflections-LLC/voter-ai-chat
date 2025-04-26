'use client';

import React, { useRef, useEffect } from 'react';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import esriConfig from '@arcgis/core/config.js';

// Placeholder types - replace with actual ArcGIS types later
type MapViewType = any;
type MapType = any;

interface MapViewProps {
  // Define any props needed, e.g., initial center, zoom, basemap
}

const MapViewComponent: React.FC<MapViewProps> = (props) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null); // Use ref to hold the view instance for cleanup

  useEffect(() => {
    // Only run if the mapDivRef is available
    if (!mapDivRef.current) {
      console.error("Map container div not available.");
      return;
    }

    // Configure API Key
    const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
    if (!apiKey) {
      console.warn("ArcGIS API Key (NEXT_PUBLIC_ARCGIS_API_KEY) is not set. Basemap/services may fail.");
    } else {
      esriConfig.apiKey = apiKey;
    }

    // Initialize Map
    const map = new Map({
      basemap: "arcgis/topographic" // Basemap layer service
      // You could use other basemap IDs like: "arcgis/streets", "arcgis-imagery", etc.
    });

    // Initialize MapView
    const view = new MapView({
      container: mapDivRef.current, // The id of the div element (via ref)
      map: map,                   // References the map object
      center: [-82.9, 32.7],      // Approx center of GA [longitude, latitude]
      zoom: 7                     // Sets the zoom level based on level of detail (LOD)
    });

    viewRef.current = view; // Store the view instance in the ref

    // Optional: Log when view is ready
    view.when(() => {
      console.log("MapView initialized successfully.");
    }).catch(error => {
      console.error("MapView failed to initialize:", error);
    });

    // Cleanup function: Called when the component unmounts
    return () => {
      if (viewRef.current) {
        // Destroy the view to release resources
        viewRef.current.destroy();
        console.log("MapView destroyed.");
        viewRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return (
    <div ref={mapDivRef} style={{ height: '100%', width: '100%' }}>
      {/* Map will be rendered here by ArcGIS SDK */}
    </div>
  );
};

export default MapViewComponent; 