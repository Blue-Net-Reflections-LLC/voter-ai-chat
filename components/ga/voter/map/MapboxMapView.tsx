'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { CircleLayerSpecification } from 'mapbox-gl';
import mapboxgl, { LngLatBounds } from 'mapbox-gl'; // Import LngLatBounds
import type { Feature, Point, FeatureCollection } from 'geojson';
import { useMapState } from '@/context/MapStateContext'; // Import the context hook
import { useDebounceCallback } from 'usehooks-ts'; // Corrected import hook name
import { useVoterFilterContext } from '@/app/ga/voter/VoterFilterProvider'; // Import filter context
import type { FilterState } from '@/app/ga/voter/list/types'; // Import FilterState type
import { ZOOM_COUNTY_LEVEL, ZOOM_CITY_LEVEL, ZOOM_ZIP_LEVEL } from '@/lib/map-constants'; // Import shared constants

// Define types for features (Keep these local or move to context if preferred)
interface VoterAddressProperties {
  address?: string;
  aggregationLevel?: 'county' | 'city' | 'zip' | 'address';
  count?: number;
  label?: string;
}
type VoterAddressFeature = Feature<Point, VoterAddressProperties>;

// Define precise type for style object (Keep local)
type ReactMapGlCircleLayerStyle = Omit<CircleLayerSpecification, 'id' | 'type' | 'source'>;

// Define component props (Remove onLoadingChange)
interface MapboxMapViewProps {
  // Add other props as needed (e.g., map style)
}

// Component using the context
const MapboxMapView: React.FC<MapboxMapViewProps> = () => {
  const mapRef = useRef<MapRef>(null);
  const isInitialLoadRef = useRef<boolean>(true); // Ref to track initial load (first time ever)
  const prevFiltersRef = useRef<FilterState | null>(null); // Ref for previous filters
  const controllerRef = useRef<AbortController | null>(null); // Store current fetch controller
  
  // Local state for tracking fetch queue
  const [fetchTrigger, setFetchTrigger] = useState<{
    type: 'initial' | 'filter' | 'bounds' | null;
    timestamp: number;
  }>({ type: null, timestamp: 0 });
  
  // Local state for tracking if a map is ready for fetching
  const [mapReady, setMapReady] = useState(false);

  // Get state and setters from context
  const {
    viewState,
    setViewState,
    voterFeatures,
    setVoterFeatures,
    isLoading, // Get loading state from context
    setIsLoading,
    apiParams,
    setApiParams,
    isFittingBounds,
    setIsFittingBounds
  } = useMapState();

  // Get state from contexts
  const { filters } = useVoterFilterContext(); // Get current filters

  // --- Update API Params Function ---
  // This ONLY updates the apiParams in context, it DOES NOT trigger fetches directly
  const updateApiParams = useCallback((newZoom: number, newBounds: mapboxgl.LngLatBounds | null) => {
    if (newBounds) {
      const currentZoomInt = Math.floor(apiParams.zoom);
      const newZoomInt = Math.floor(newZoom);
      
      const boundsChanged = 
          !apiParams.bounds || 
          Math.abs(apiParams.bounds.getWest() - newBounds.getWest()) > 0.0001 ||
          Math.abs(apiParams.bounds.getSouth() - newBounds.getSouth()) > 0.0001 ||
          Math.abs(apiParams.bounds.getEast() - newBounds.getEast()) > 0.0001 ||
          Math.abs(apiParams.bounds.getNorth() - newBounds.getNorth()) > 0.0001;
          
      const zoomLevelChanged = currentZoomInt !== newZoomInt;

      if (boundsChanged || zoomLevelChanged) {
        // console.log('Significant view change detected, updating API params.');
        setApiParams({ zoom: newZoom, bounds: newBounds });
        
        // Only trigger bounds fetch if not in initial load and not fitting bounds
        if (!isInitialLoadRef.current && !isFittingBounds) {
          // console.log('Adding bounds change to fetch queue');
          setFetchTrigger({ type: 'bounds', timestamp: Date.now() });
        }
      }
    }
  }, [apiParams, setApiParams, isInitialLoadRef, isFittingBounds]);

  // --- Debounced version of the API param update ---
  const debouncedUpdateApiParams = useDebounceCallback(updateApiParams, 500);

  // --- Handler for map idle to update API params ---
  const handleIdle = useCallback(() => {
    // Prevent updating params if we are programmatically fitting bounds
    if (isFittingBounds) {
      // console.log('handleIdle skipped: currently fitting bounds');
      return;
    }
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const newZoom = map.getZoom();
      const newBounds = map.getBounds();
      debouncedUpdateApiParams(newZoom, newBounds);
    }
  }, [isFittingBounds, debouncedUpdateApiParams]);

  // --- Map Load Event Handler ---
  const handleLoad = useCallback(() => {
    if (mapRef.current) {
      // console.log("Map loaded");
      const map = mapRef.current.getMap();
      
      // Update API params on load (don't trigger a fetch directly)
      setApiParams({
        zoom: map.getZoom(), 
        bounds: map.getBounds()
      });
      
      // Mark the map as ready for fetching data and queue initial fetch
      setMapReady(true);
      
      if (isInitialLoadRef.current) {
        // console.log('Queueing initial fetch on map load');
        setFetchTrigger({ type: 'initial', timestamp: Date.now() });
      }
    }
  }, [setApiParams, isInitialLoadRef]);

  // --- Watch filters and queue fetch when they change --- 
  useEffect(() => {
    // Only add to fetch queue if map is ready and not first load
    if (mapReady && !isInitialLoadRef.current) {
      const filtersString = JSON.stringify(filters);
      const prevFiltersString = JSON.stringify(prevFiltersRef.current);
      const filtersChanged = filtersString !== prevFiltersString;
      
      if (filtersChanged) {
        // console.log('Filters changed, adding to fetch queue');
        setFetchTrigger({ type: 'filter', timestamp: Date.now() });
      }
    }
  }, [filters, mapReady]);

  // --- Main fetch function ---
  const fetchData = useCallback(async (fetchType: 'initial' | 'filter' | 'bounds') => {
    // console.log(`FETCH STARTED [Type: ${fetchType}]`);
    
    // Abort any in-progress fetch
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    
    if (!apiParams.bounds) {
      console.warn("Cannot fetch: No bounds available");
      return;
    }
    
    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = controller.signal;
    
    setIsLoading(true);
    setVoterFeatures([]);
    
    try {
      // Construct URL with apiParams and filters
      const url = new URL('/api/ga/voter/map-data', window.location.origin);
      url.searchParams.append('zoom', apiParams.zoom.toFixed(2));
      url.searchParams.append('minLng', apiParams.bounds!.getWest().toString());
      url.searchParams.append('minLat', apiParams.bounds!.getSouth().toString());
      url.searchParams.append('maxLng', apiParams.bounds!.getEast().toString());
      url.searchParams.append('maxLat', apiParams.bounds!.getNorth().toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => url.searchParams.append(key, v));
        } else if (typeof value === 'string' && value) {
          url.searchParams.set(key, value);
        } else if (typeof value === 'boolean' && value) {
          url.searchParams.set(key, 'true');
        }
      });

      const response = await fetch(url.toString(), { signal });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const geojsonData: FeatureCollection<Point, VoterAddressProperties> = await response.json();
      // console.log(`Fetch successful, received ${geojsonData.features.length} features.`);
      
      // Store current filters to prevent redundant fetches
      prevFiltersRef.current = JSON.parse(JSON.stringify(filters));
      
      setVoterFeatures(geojsonData.features);
      setIsLoading(false);
      controllerRef.current = null;

      // FIT BOUNDS on initial load OR filter change
      const shouldFitBounds = fetchType === 'initial' || fetchType === 'filter';
      // console.log(`Should fit bounds? ${shouldFitBounds} (${fetchType})`);

      if (shouldFitBounds && mapRef.current && geojsonData.features.length > 0) {
        // console.log(`Fitting bounds/view to ${geojsonData.features.length} features.`);
        try {
          const bounds = geojsonData.features.reduce((bounds, feature) => {
            if (feature?.geometry?.coordinates) {
              return bounds.extend(feature.geometry.coordinates as [number, number]);
            }
            return bounds;
          }, new LngLatBounds());

          if (!bounds.isEmpty()) {
            const cameraOptions = mapRef.current.cameraForBounds(bounds, { padding: 60 });
            if (cameraOptions) {
              let targetZoom = cameraOptions.zoom ?? viewState.zoom;
              const targetCenter = cameraOptions.center ?? {lng: viewState.longitude, lat: viewState.latitude };
              
              // Threshold Capping Logic
              const ZOOM_THRESHOLDS = [ZOOM_COUNTY_LEVEL, ZOOM_CITY_LEVEL, ZOOM_ZIP_LEVEL];
              let crossedThreshold = false;
              for (const threshold of ZOOM_THRESHOLDS) {
                if (viewState.zoom < threshold && targetZoom >= threshold) {
                  // console.log(`FitBounds calculated zoom ${targetZoom.toFixed(2)} crosses threshold ${threshold}. Capping zoom.`);
                  targetZoom = threshold - 0.1; // Set zoom just below the threshold
                  crossedThreshold = true;
                  break; // Stop checking thresholds
                }
              }
              if (!crossedThreshold && targetZoom > 16) { // Also cap max zoom if needed
                // console.log(`FitBounds calculated zoom ${targetZoom.toFixed(2)} exceeds maxZoom 16. Capping zoom.`);
                targetZoom = 16;
              }

              setIsFittingBounds(true);
              // console.log(`Flying to center: ${JSON.stringify(targetCenter)}, capped zoom: ${targetZoom.toFixed(2)}`);
              mapRef.current.flyTo({
                center: targetCenter,
                zoom: targetZoom,
                duration: 1000 // Smooth animation
              });
              setTimeout(() => {
                setIsFittingBounds(false);
                
                // Update API params after fitBounds completes to avoid a ping-pong effect
                if (mapRef.current) {
                  const map = mapRef.current.getMap();
                  // Update params but don't queue a fetch (internal update)
                  setApiParams({
                    zoom: map.getZoom(),
                    bounds: map.getBounds()
                  });
                }
              }, 1100); // Slightly longer than duration
            }
          }
        } catch (error) {
          console.error("Error during fitBounds/flyTo calculation or execution:", error);
          setIsFittingBounds(false);
        }
      }
      
      // No longer initial load
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // console.log("Fetch aborted.");
      } else {
        console.error("Error fetching map data:", error);
        setIsLoading(false);
        setVoterFeatures([]);
        controllerRef.current = null;
      }
    }
  }, [apiParams, filters, setVoterFeatures, setIsLoading, setIsFittingBounds, viewState, setApiParams]);

  // --- SINGLE EFFECT: Process fetch queue --- 
  useEffect(() => {
    // Only process fetch queue when map is ready and we have a trigger
    if (mapReady && fetchTrigger.type) {
      // console.log(`Processing fetch queue: ${fetchTrigger.type}`);
      
      // Execute the fetch
      fetchData(fetchTrigger.type);
      
      // Clear the queue after processing
      setFetchTrigger({ type: null, timestamp: 0 });
    }
  }, [mapReady, fetchTrigger, fetchData]);

  // --- Cleanup on component unmount ---
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        // console.log("Cleaning up fetch controller on unmount");
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, []);

  // --- Layer Styling --- //
  const voterLayerStyle: ReactMapGlCircleLayerStyle = {
    paint: {
      'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          1, 4, // If count is 1, radius is 4
          100, 8, // If count is 100, radius is 8
          1000, 15, // If count is 1000, radius is 15
          10000, 25 // If count is 10000, radius is 25
      ],
      'circle-color': [
          'match',
          ['get', 'aggregationLevel'],
          'county', '#fbb03b', // Orange for county
          'city', '#223b53', // Dark blue for city
          'zip', '#e55e5e', // Red for zip
          'address', '#1e90ff', // Dodger blue for address
          '#cccccc' // Default grey
      ],
      'circle-opacity': 0.7,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff'
    }
  };

  // Create FeatureCollection for the Source component from context state
  const voterFeatureCollection: FeatureCollection<Point, VoterAddressProperties> = {
    type: 'FeatureCollection',
    features: voterFeatures // Use features from context
  };

  return (
    <div style={{ height: '100%', width: '100%' }} >
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        {...viewState} // Use viewState from context
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)} // Update context viewState
        onLoad={handleLoad} // Set initial API params on load
        onIdle={handleIdle} // Update API params when map movement stops
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
          <Source
            id="voter-addresses"
            type="geojson"
            data={voterFeatureCollection} // Feed data from context
          >
            <Layer id="voter-points" type="circle" {...voterLayerStyle} />
            {/* TODO: Add layer for text labels on aggregated points */}
          </Source>
      </Map>
    </div>
  );
};

export default MapboxMapView; 