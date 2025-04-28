'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { CircleLayerSpecification } from 'mapbox-gl';
import mapboxgl, { LngLatBounds } from 'mapbox-gl'; // Import LngLatBounds
import type { Feature, Point, FeatureCollection } from 'geojson';
import { useMapState } from '@/context/MapStateContext'; // Import the context hook
import { useDebounceCallback } from 'usehooks-ts'; // Corrected import hook name

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

  // --- Data Fetching Effect (Refactored for fetch) --- //
  useEffect(() => {
    // Don't fetch if bounds aren't set yet (wait for onLoad)
    if (!apiParams.bounds) {
      console.log("Map bounds not yet available, skipping initial fetch.");
      return;
    }

    const controller = new AbortController(); // Abort controller for fetch
    const signal = controller.signal;

    const fetchData = async () => {
      console.log("API Params changed, fetching data:", apiParams);
      setIsLoading(true);
      setVoterFeatures([]); // Clear previous features immediately

      // Construct API URL
      const url = new URL('/api/ga/voter/map-data', window.location.origin);
      url.searchParams.append('zoom', apiParams.zoom.toFixed(2));
      url.searchParams.append('minLng', apiParams.bounds!.getWest().toString()); // Use non-null assertion
      url.searchParams.append('minLat', apiParams.bounds!.getSouth().toString());
      url.searchParams.append('maxLng', apiParams.bounds!.getEast().toString());
      url.searchParams.append('maxLat', apiParams.bounds!.getNorth().toString());
      // TODO: Add sidebar filters here later

      try {
        const response = await fetch(url.toString(), { signal }); // Pass abort signal
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const geojsonData: FeatureCollection<Point, VoterAddressProperties> = await response.json();

        console.log(`Fetch successful, received ${geojsonData.features.length} features.`);

        // Update state with fetched features
        setVoterFeatures(geojsonData.features);
        setIsLoading(false);

        // --- Fit Bounds Logic (TEMPORARILY DISABLED) --- //
        /*
        if (mapRef.current && geojsonData.features.length > 0) {
             console.log(`Fitting bounds to ${geojsonData.features.length} features.`);
            try {
                const bounds = geojsonData.features.reduce((bounds, feature) => {
                    if (feature?.geometry?.coordinates) {
                        return bounds.extend(feature.geometry.coordinates as [number, number]);
                    }
                    return bounds;
                }, new LngLatBounds());

                if (!bounds.isEmpty()) {
                    setIsFittingBounds(true);
                    mapRef.current.fitBounds(bounds, {
                        padding: 60, maxZoom: 16, duration: 1000
                    });
                    setTimeout(() => setIsFittingBounds(false), 1100);
                }
            } catch (error) {
                console.error("Error during fitBounds:", error);
                setIsFittingBounds(false);
            }
        } else {
            console.log("Skipping fitBounds: No features loaded or map not ready.");
        }
        */
        console.log("Auto fitBounds after fetch is disabled."); // Log that it's disabled
        // -------------------------------------------------- //

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

    // Cleanup function to abort fetch if params change before completion
    return () => {
      console.log("Aborting previous fetch (cleanup)");
      controller.abort();
      // Optionally reset loading state if needed, though typically handled by the new fetch start
      // setIsLoading(false);
    };
    // Depend only on apiParams (and later sidebar filters)
  }, [apiParams, setVoterFeatures, setIsLoading, setIsFittingBounds]);

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