'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import esriConfig from '@arcgis/core/config.js';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import Graphic from '@arcgis/core/Graphic.js'; 
import Point from '@arcgis/core/geometry/Point.js'; // Needed for type checking if geometry is Point
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol.js'; // Import the symbol class

// Import context and query param builder
import { useVoterFilterContext, buildQueryParams } from '@/app/ga/voter/VoterFilterProvider';

// Define a simple symbol for the points
const pointSymbol = new SimpleMarkerSymbol({
  color: [226, 119, 40], // Orange
  size: "6px",
  outline: {
    color: [255, 255, 255], // White
    width: 1
  }
});

// Placeholder types - replace with actual ArcGIS types later
type MapViewType = any;
type MapType = any;

interface MapViewProps {
  onLoadingChange?: (isLoading: boolean) => void;
}

const MapViewComponent: React.FC<MapViewProps> = ({ onLoadingChange }) => {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const pendingGraphicsRef = useRef<Graphic[]>([]); // Ref to store graphics waiting to be added
  const renderScheduledRef = useRef<number | null>(null); // Ref to hold requestAnimationFrame ID

  const [isLoading, setIsLoadingInternal] = useState(false);
  const [sseSource, setSseSource] = useState<EventSource | null>(null);

  const { filters, residenceAddressFilters, filtersHydrated } = useVoterFilterContext();

  // Wrapper function to update local state and call prop
  const setIsLoading = (loading: boolean) => {
    setIsLoadingInternal(loading);
    onLoadingChange?.(loading); // Call the prop function if provided
  };

  // Function to add pending graphics to the layer
  const processPendingGraphics = useCallback(() => {
    renderScheduledRef.current = null; // Clear schedule ID
    if (graphicsLayerRef.current && pendingGraphicsRef.current.length > 0) {
      const graphicsToAdd = [...pendingGraphicsRef.current]; // Copy the array
      pendingGraphicsRef.current = []; // Clear pending graphics *before* adding
      graphicsLayerRef.current.addMany(graphicsToAdd);
      // console.log(`Added ${graphicsToAdd.length} graphics`);
    }
  }, []); // No dependencies needed as it uses refs

  // Effect for initializing the map and graphics layer once
  useEffect(() => {
    if (!mapDivRef.current || viewRef.current) {
      // Already initialized or container not ready
      return;
    }

    console.log('MapView: Initializing Map and View...');
    
    // Configure API Key
    const apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;
    if (!apiKey) {
      console.warn("ArcGIS API Key (NEXT_PUBLIC_ARCGIS_API_KEY) is not set.");
    } else {
      esriConfig.apiKey = apiKey;
    }

    // Create GraphicsLayer
    const layer = new GraphicsLayer({
        id: 'voter-address-points' // Assign an ID for potential later reference
    });
    graphicsLayerRef.current = layer;

    // Initialize Map with the graphics layer
    const map = new Map({
      basemap: "arcgis/topographic",
      layers: [layer] // Add the graphics layer here
    });

    // Initialize MapView
    const view = new MapView({
      container: mapDivRef.current,
      map: map,
      center: [-82.9, 32.7],
      zoom: 7
    });

    viewRef.current = view;

    view.when(() => {
      console.log("MapView initialized successfully with GraphicsLayer.");
    }).catch(error => {
      console.error("MapView failed to initialize:", error);
    });

    // Cleanup function
    return () => {
      // Check if view exists and is ready before destroying
      if (viewRef.current && viewRef.current.ready) {
        viewRef.current.destroy();
        console.log("MapView destroyed.");
        viewRef.current = null;
        graphicsLayerRef.current = null;
      } else if (viewRef.current) {
        // If view exists but wasn't ready, still try to nullify refs
        console.log("MapView cleanup: View existed but was not ready.");
        viewRef.current = null;
        graphicsLayerRef.current = null;
      }
      // Cancel any pending animation frame on cleanup
      if (renderScheduledRef.current) {
        cancelAnimationFrame(renderScheduledRef.current);
        renderScheduledRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect for handling SSE connection based on filters
  useEffect(() => {
    if (!filtersHydrated || !graphicsLayerRef.current || !viewRef.current) {
      console.log('MapView SSE Effect: Skipping, dependencies not ready.');
      return;
    }

    console.log('MapView SSE Effect: Filters changed or hydrated. Setting up SSE.');

    // 1. Close existing EventSource (if any)
    sseSource?.close();
    setSseSource(null);

    // 2. Clear existing graphics
    graphicsLayerRef.current.removeAll();
    const addedGraphicsForZoom: Graphic[] = []; // Track graphics *successfully added* for zooming
    if (renderScheduledRef.current) {
        cancelAnimationFrame(renderScheduledRef.current);
        renderScheduledRef.current = null;
    }

    // 3. setIsLoading(true)
    setIsLoading(true);

    // 4. Build query params string
    const queryParams = buildQueryParams(filters, residenceAddressFilters);
    const apiUrl = `/api/ga/voter/map-data?${queryParams.toString()}`;
    console.log(`MapView SSE: Connecting to ${apiUrl}`);

    // 5. Create new EventSource
    const newSource = new EventSource(apiUrl);
    setSseSource(newSource);

    // 6. Setup event listeners
    newSource.onopen = () => {
        console.log('MapView SSE: Connection opened.');
        // Typically still loading until first message or end
    };

    newSource.onerror = (error) => {
        console.error('MapView SSE: Error', error);
        setIsLoading(false); // Update loading state
        newSource.close();
        setSseSource(null);
    };

    newSource.onmessage = (event) => {
        let graphic: Graphic | null = null;
        try {
            const featureData = JSON.parse(event.data);

            // **Stricter Geometry Validation**
            if (
                featureData && 
                featureData.type === 'Feature' && 
                featureData.geometry && 
                featureData.geometry.type === 'Point' && 
                Array.isArray(featureData.geometry.coordinates) && 
                featureData.geometry.coordinates.length >= 2 &&
                typeof featureData.geometry.coordinates[0] === 'number' &&
                typeof featureData.geometry.coordinates[1] === 'number'
            ) {
                // **Explicit Point Creation**
                const pointGeometry = new Point({
                    longitude: featureData.geometry.coordinates[0],
                    latitude: featureData.geometry.coordinates[1],
                    // Assuming WGS84 (lat/lon) which is common for GeoJSON
                    // spatialReference: { wkid: 4326 } // Usually inferred correctly
                });

                // **Try/Catch Graphic Creation/Adding**
                try {
                    graphic = new Graphic({
                        geometry: pointGeometry, // Use the created Point object
                        attributes: featureData.properties, 
                        symbol: pointSymbol 
                    });
                    // Add to pending batch instead of directly to layer
                    pendingGraphicsRef.current.push(graphic);
                    addedGraphicsForZoom.push(graphic); // Still track for zoom extent

                    // Schedule adding the batch if not already scheduled
                    if (!renderScheduledRef.current) {
                        renderScheduledRef.current = requestAnimationFrame(processPendingGraphics);
                    }
                } catch (graphicError) {
                    console.error('MapView SSE: Error creating/adding graphic:', graphicError, featureData);
                }

            } else {
                console.warn('MapView SSE: Received invalid or non-point feature data:', featureData);
            }
        } catch (e) {
            console.error('MapView SSE: Error parsing message data:', e, event.data);
        }
    };

    newSource.addEventListener('end', (event: MessageEvent<string>) => {
        try {
            // Ensure any remaining pending graphics are added immediately
            if (renderScheduledRef.current) cancelAnimationFrame(renderScheduledRef.current);
            processPendingGraphics(); // Process any remaining graphics

            console.log(`MapView SSE: 'end' event received.`, event.data);
            setIsLoading(false);
            newSource.close();
            setSseSource(null);
            
            // Auto-zoom using the tracked graphics (addedGraphicsForZoom)
            if (viewRef.current && viewRef.current.ready && !viewRef.current.destroyed && addedGraphicsForZoom.length > 0) {
                 console.log(`MapView SSE: Zooming to ${addedGraphicsForZoom.length} graphics.`);
                 viewRef.current.goTo(addedGraphicsForZoom).catch(err => {
                    if (err.name !== "AbortError") { console.error("Error zooming:", err); }
                 });
            } else if (viewRef.current && addedGraphicsForZoom.length === 0) {
                console.log('MapView SSE: No graphics added, cannot auto-zoom.');
            }
        } catch (e) {
            console.error("MapView SSE: Error processing 'end' event:", e);
            setIsLoading(false); // Ensure loading is off
            newSource.close();
            setSseSource(null);
        }
    });

    // Cleanup function for THIS effect
    return () => {
      console.log('MapView SSE Effect: Cleanup (closing EventSource, cancelling frame).');
      newSource.close();
      setSseSource(null);
      setIsLoading(false);
      // Cancel any pending animation frame on cleanup
      if (renderScheduledRef.current) {
        cancelAnimationFrame(renderScheduledRef.current);
        renderScheduledRef.current = null;
      }
    };
  }, [filters, residenceAddressFilters, filtersHydrated, processPendingGraphics]); // Add processPendingGraphics to dependency array

  return (
    <div ref={mapDivRef} style={{ height: '100%', width: '100%' }}>
      {/* Map is rendered here */}
      {/* Consider adding loading overlay based on isLoading state */}
    </div>
  );
};

export default MapViewComponent; 