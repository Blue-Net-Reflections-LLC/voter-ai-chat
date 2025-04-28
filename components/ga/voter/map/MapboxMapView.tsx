'use client';

import React, { useRef, useEffect, useCallback } from 'react';
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
  const isInitialLoadRef = useRef<boolean>(true); // Ref to track initial load
  const prevFiltersRef = useRef<FilterState | null>(null); // Ref for previous filters
  const prevApiParamsRef = useRef<{ zoom: number; bounds: mapboxgl.LngLatBounds | null } | null>(null); // Ref for previous API params

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

  // --- Debounced function to update API params --- //
  const debouncedSetApiParams = useDebounceCallback((newZoom: number, newBounds: mapboxgl.LngLatBounds | null) => {
      if (newBounds) {
          const currentZoomInt = Math.floor(apiParams.zoom);
          const newZoomInt = Math.floor(newZoom);
          
          // Compare bounds with a small tolerance or simpler method
          const boundsChanged = 
              !apiParams.bounds || 
              Math.abs(apiParams.bounds.getWest() - newBounds.getWest()) > 0.0001 ||
              Math.abs(apiParams.bounds.getSouth() - newBounds.getSouth()) > 0.0001 ||
              Math.abs(apiParams.bounds.getEast() - newBounds.getEast()) > 0.0001 ||
              Math.abs(apiParams.bounds.getNorth() - newBounds.getNorth()) > 0.0001;
              
          const zoomLevelChanged = currentZoomInt !== newZoomInt;

          if (boundsChanged || zoomLevelChanged) {
              console.log('Significant view change detected, updating API params.');
              setApiParams({ zoom: newZoom, bounds: newBounds });
          } else {
            // console.log('Minor view change, skipping API param update.');
          }
      }
  }, 500);

  // --- Map Event Handlers --- //
  const handleLoad = useCallback(() => {
    if (mapRef.current) {
        const map = mapRef.current.getMap();
        // Set initial API params once map is loaded
        // Use current map state rather than initial state, in case it was modified
        setApiParams({
            zoom: map.getZoom(), 
            bounds: map.getBounds()
        });
    }
  }, [setApiParams]); // Only depends on the setter

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
      debouncedSetApiParams(newZoom, newBounds);
    }
  }, [isFittingBounds, debouncedSetApiParams]); // Add isFittingBounds to dependency

  // --- Data Fetching Effect --- //
  useEffect(() => {
    if (!apiParams.bounds) {
      // console.log("Map bounds not yet available, skipping initial fetch.");
      return;
    }

    // Determine if filters changed since last fetch triggered by this effect
    const filtersString = JSON.stringify(filters);
    const prevFiltersString = JSON.stringify(prevFiltersRef.current);
    const filtersChanged = filtersString !== prevFiltersString;

    // Determine if map view changed since last fetch triggered by this effect
    const apiParamsString = JSON.stringify(apiParams);
    const prevApiParamsString = JSON.stringify(prevApiParamsRef.current);
    const mapParamsChanged = apiParamsString !== prevApiParamsString;

    // Only proceed if map view changed OR filters changed
    if (!mapParamsChanged && !filtersChanged && !isInitialLoadRef.current) {
      // console.log("Skipping fetch: Neither map params nor filters changed significantly.");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      console.log(`Fetching data. Filters changed: ${filtersChanged}, Map params changed: ${mapParamsChanged}, Initial: ${isInitialLoadRef.current}`);
      setIsLoading(true);
      setVoterFeatures([]);

      // Construct URL (Pass filters)
      const url = new URL('/api/ga/voter/map-data', window.location.origin);
      url.searchParams.append('zoom', apiParams.zoom.toFixed(2));
      url.searchParams.append('minLng', apiParams.bounds!.getWest().toString());
      url.searchParams.append('minLat', apiParams.bounds!.getSouth().toString());
      url.searchParams.append('maxLng', apiParams.bounds!.getEast().toString());
      url.searchParams.append('maxLat', apiParams.bounds!.getNorth().toString());

      // --- Add Filters to URL Params --- TODO: Use buildQueryParams from VoterFilterProvider?
      Object.entries(filters).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
              value.forEach(v => url.searchParams.append(key, v)); // Use key directly for now
          } else if (typeof value === 'string' && value) {
              url.searchParams.set(key, value);
          } else if (typeof value === 'boolean' && value) {
              url.searchParams.set(key, 'true');
          }
      });
      // -------------------------------------

      try {
        const response = await fetch(url.toString(), { signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const geojsonData: FeatureCollection<Point, VoterAddressProperties> = await response.json();
        console.log(`Fetch successful, received ${geojsonData.features.length} features.`);
        setVoterFeatures(geojsonData.features);
        setIsLoading(false);

        // --- Conditional Fit Bounds Logic --- //
        const shouldFitBounds = isInitialLoadRef.current || filtersChanged;
        console.log(`Should fit bounds? Initial=${isInitialLoadRef.current}, FiltersChanged=${filtersChanged} -> ${shouldFitBounds}`);

        if (shouldFitBounds && mapRef.current && geojsonData.features.length > 0) {
             console.log(`Fitting bounds/view to ${geojsonData.features.length} features.`);
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
                        const currentZoomInt = Math.floor(viewState.zoom);
                        const targetZoomInt = Math.floor(targetZoom);

                        // --- Threshold Capping Logic --- //
                        const ZOOM_THRESHOLDS = [ZOOM_COUNTY_LEVEL, ZOOM_CITY_LEVEL, ZOOM_ZIP_LEVEL];
                        let crossedThreshold = false;
                        for (const threshold of ZOOM_THRESHOLDS) {
                            if (viewState.zoom < threshold && targetZoom >= threshold) {
                                console.log(`FitBounds calculated zoom ${targetZoom.toFixed(2)} crosses threshold ${threshold}. Capping zoom.`);
                                targetZoom = threshold - 0.1; // Set zoom just below the threshold
                                crossedThreshold = true;
                                break; // Stop checking thresholds
                            }
                        }
                        if (!crossedThreshold && targetZoom > 16) { // Also cap max zoom if needed
                            console.log(`FitBounds calculated zoom ${targetZoom.toFixed(2)} exceeds maxZoom 16. Capping zoom.`);
                            targetZoom = 16;
                        }
                        // -------------------------------- //

                        setIsFittingBounds(true);
                        console.log(`Flying to center: ${JSON.stringify(targetCenter)}, capped zoom: ${targetZoom.toFixed(2)}`);
                        mapRef.current.flyTo({
                            center: targetCenter,
                            zoom: targetZoom,
                            duration: 1000 // Smooth animation
                        });
                        setTimeout(() => setIsFittingBounds(false), 1100); // Slightly longer than duration
                    } else {
                        console.warn("Could not calculate camera options for bounds.");
                    }
                } else {
                     console.warn("Cannot fit view: Calculated bounds are empty.");
                }
            } catch (error) {
                console.error("Error during fitBounds/flyTo calculation or execution:", error);
                setIsFittingBounds(false);
            }
        } else if (shouldFitBounds) { 
             console.log("Skipping fit view: No features loaded or map not ready.");
        }
        // ---------------------------------- //

        // Update refs *after* successful fetch and potential fitBounds trigger
        prevFiltersRef.current = JSON.parse(filtersString); // Store deep copy
        isInitialLoadRef.current = false; // No longer initial load

      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log("Fetch aborted.");
        } else {
          console.error("Error fetching map data:", error);
          setIsLoading(false);
          setVoterFeatures([]); // Clear features on error
        }
      }
    };

    fetchData();

    // Update previous API params ref immediately before cleanup
    prevApiParamsRef.current = JSON.parse(apiParamsString); // Store deep copy

    return () => {
      console.log("Aborting previous fetch (cleanup)");
      controller.abort();
    };
  // Add filters to dependency array
  }, [apiParams, filters, setVoterFeatures, setIsLoading, setIsFittingBounds, viewState.zoom, viewState.longitude, viewState.latitude]);

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