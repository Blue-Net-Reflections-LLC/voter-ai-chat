'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import type { CircleLayerSpecification } from 'mapbox-gl';
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
    sseStatus, // Keep for potential UI feedback
    setSseStatus,
    setIsLoading, // Use context setter for loading state
    apiParams,
    setApiParams,
  } = useMapState();

  // --- Debounced function to update API params --- //
  const debouncedSetApiParams = useDebounceCallback((newZoom: number, newBounds: mapboxgl.LngLatBounds | null) => {
      setApiParams({ zoom: newZoom, bounds: newBounds });
  }, 500); // Adjust debounce time as needed (e.g., 500ms)

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
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const newZoom = map.getZoom();
      const newBounds = map.getBounds();
      // Debounce the update to avoid excessive calls during interaction
      debouncedSetApiParams(newZoom, newBounds);
    }
  }, [debouncedSetApiParams]); // Corrected dependency

  // --- Data Fetching Effect --- //
  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
        console.warn("Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) not configured!");
    }

    // Don't fetch if bounds haven't been set yet (wait for onLoad)
    if (!apiParams.bounds) {
      console.log("Map bounds not yet available, skipping initial SSE fetch.");
      return; 
    }

    console.log("API Params changed or initial load with bounds, fetching SSE data:", apiParams);
    setIsLoading(true); // Set loading state via context
    setVoterFeatures([]); // Clear previous features

    // Construct API URL with filters, bounds, and zoom
    const url = new URL('/api/ga/voter/map-data', window.location.origin); 
    url.searchParams.append('zoom', apiParams.zoom.toFixed(2));
    url.searchParams.append('minLng', apiParams.bounds.getWest().toString());
    url.searchParams.append('minLat', apiParams.bounds.getSouth().toString());
    url.searchParams.append('maxLng', apiParams.bounds.getEast().toString());
    url.searchParams.append('maxLat', apiParams.bounds.getNorth().toString());

    // TODO: Add actual user filters from filter context later
    // url.searchParams.append('status', filters.status); 
    // url.searchParams.append('race', filters.race);

    const eventSource = new EventSource(url.toString());
    setSseStatus('connecting');

    let featureBuffer: VoterAddressFeature[] = []; // Temporary buffer for incoming features

    // Debounced function to update React state from buffer
    const debouncedUpdateFeatures = () => {
        if (featureBuffer.length > 0) {
            setVoterFeatures(prev => [...prev, ...featureBuffer]);
            featureBuffer = []; // Clear buffer after update
        }
    };
    const throttledUpdate = setTimeout(debouncedUpdateFeatures, 100); // Throttle updates (e.g., every 100ms)

    eventSource.onopen = () => {
      console.log("SSE Connection Opened");
      setSseStatus('open');
    };

    eventSource.onmessage = (event) => {
      try {
        const newFeature = JSON.parse(event.data) as VoterAddressFeature;
        if (newFeature?.geometry?.type === 'Point' && newFeature.properties) {
          featureBuffer.push(newFeature); // Add to buffer
          // Schedule update (throttling handles frequency)
        } else {
          console.warn("Received invalid feature data:", event.data);
        }
      } catch (error) {
        console.error("Error parsing SSE message data:", error);
      }
    };

    // Custom 'end' event listener
    eventSource.addEventListener('end', () => {
        console.log("SSE Stream Ended by Server");
        clearTimeout(throttledUpdate); // Clear any pending throttled update
        debouncedUpdateFeatures(); // Update with any remaining features in buffer
        setIsLoading(false); // Clear loading state via context
        setSseStatus('closed');
        eventSource.close();
        // TODO: Implement fitBounds after data load
        // if (mapRef.current && voterFeatures.length > 0) { ... fit bounds logic ... }
    });

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      clearTimeout(throttledUpdate);
      setIsLoading(false); // Clear loading state via context
      setSseStatus('closed');
      eventSource.close();
    };

    // Cleanup: close EventSource when effect re-runs or component unmounts
    return () => {
      console.log("Closing SSE connection (Cleanup)");
      clearTimeout(throttledUpdate);
      eventSource.close();
      setSseStatus('closed');
      // Optionally reset loading state if effect is cleaning up due to param change before 'end' or 'error'
      // setIsLoading(false); 
    };
    // Depend on apiParams (and later, user filters)
  }, [apiParams, setVoterFeatures, setSseStatus, setIsLoading]); 

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