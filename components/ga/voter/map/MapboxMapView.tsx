'use client';

import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from 'react-map-gl/mapbox'; // Core map components
// import type { CircleLayer } from 'mapbox-gl'; // Import CircleLayer type from mapbox-gl types <-- Deprecated
import type { CircleLayerSpecification } from 'mapbox-gl'; // Use CircleLayerSpecification
import type { Feature, Point, FeatureCollection } from 'geojson'; // Import FeatureCollection

// Define a type for our specific Voter Address Feature properties
interface VoterAddressProperties {
  address: string;
  // Add other potential properties if needed
}

// Define the specific Feature type we expect
type VoterAddressFeature = Feature<Point, VoterAddressProperties>;

interface MapboxMapViewProps {
  onLoadingChange?: (isLoading: boolean) => void; // Keep prop for progress bar
  // Add other props as needed (e.g., map style)
}

// Define SSE Connection Status type
type SseStatus = 'connecting' | 'open' | 'closed';

// Define a more precise type for the style object passed to react-map-gl Layer
// It omits properties handled directly by the Layer component props (id, type, source)
type ReactMapGlCircleLayerStyle = Omit<CircleLayerSpecification, 'id' | 'type' | 'source'>;

const MapboxMapView: React.FC<MapboxMapViewProps> = ({ onLoadingChange }) => {
  // Ref uses MapRef from react-map-gl/mapbox
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    longitude: -82.9,
    latitude: 32.7,
    zoom: 6.5 // Adjusted initial zoom slightly
  });

  // State for SSE connection status
  const [sseStatus, setSseStatus] = useState<SseStatus>('connecting');
  // State to store received voter address features
  const [voterFeatures, setVoterFeatures] = useState<VoterAddressFeature[]>([]);

  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
        console.warn("Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) not configured!");
    }
    console.log("MapboxMapView component mounted - Initializing SSE");

    // Correct API endpoint from design doc
    const eventSource = new EventSource('/api/ga/voter/map-data');
    setSseStatus('connecting');

    eventSource.onopen = () => {
      console.log("SSE Connection Opened");
      setSseStatus('open');
      // Maybe trigger onLoadingChange(false) here if loading was tied to SSE?
    };

    eventSource.onmessage = (event) => {
      try {
        const newFeature = JSON.parse(event.data) as VoterAddressFeature;
        // Basic validation (check for geometry and type)
        if (newFeature && newFeature.geometry && newFeature.geometry.type === 'Point' && newFeature.properties) {
            // console.log("Received voter feature:", newFeature.properties.address);
            // Update state - append new feature immutably
            setVoterFeatures(prevFeatures => [...prevFeatures, newFeature]);
        } else {
            console.warn("Received invalid feature data:", event.data);
        }
      } catch (error) {
        console.error("Error parsing SSE message data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      setSseStatus('closed');
      eventSource.close(); // Close connection on error
      // Maybe trigger onLoadingChange(false) here and show an error message?
    };

    // Cleanup on unmount
    return () => {
      console.log("MapboxMapView component unmounting - Closing SSE");
      eventSource.close();
      setSseStatus('closed');
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Create FeatureCollection for the Source component
  const voterFeatureCollection: FeatureCollection<Point, VoterAddressProperties> = {
    type: 'FeatureCollection',
    features: voterFeatures
  };

  // Define layer style for the circles using the precise type
  const voterLayerStyle: ReactMapGlCircleLayerStyle = {
    // id and type are props of the <Layer> component, not part of this style object
    // source is handled by nesting <Layer> within <Source>
    paint: {
      'circle-radius': 4, // Adjust size as needed
      'circle-color': '#1e90ff', // Dodger blue, adjust color as needed
      'circle-opacity': 0.7, // Slightly transparent
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff' // White outline
    }
  };

  // TODO: Use sseStatus to display connection status to the user?
  // console.log("SSE Status:", sseStatus, "Features:", voterFeatures.length);

  return (
    <div style={{ height: '100%', width: '100%' }} >
      <Map
        ref={mapRef} // Use the correctly typed ref
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} 
        {...viewState} 
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)} 
        style={{ width: '100%', height: '100%' }} // Move width/height back to style
        mapStyle="mapbox://styles/mapbox/dark-v11" // Example dark style
        // mapStyle="mapbox://styles/mapbox/streets-v12" // Example light style
      >
          <Source 
            id="voter-addresses" 
            type="geojson"
            data={voterFeatureCollection} 
          >
            {/* Pass the specific style properties, id, and type to Layer */}
            <Layer id="voter-points" type="circle" {...voterLayerStyle} /> 
          </Source>
      </Map>
    </div>
  );
};

export default MapboxMapView; 