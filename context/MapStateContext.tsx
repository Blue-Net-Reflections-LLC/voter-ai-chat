'use client';

import React, { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import type { ViewState } from 'react-map-gl/mapbox';
import type { Feature, Point, FeatureCollection } from 'geojson';
import type mapboxgl from 'mapbox-gl'; // Import mapboxgl for LngLatBounds type

// Define types from MapboxMapView for features and status
interface VoterAddressProperties {
  address?: string; // Make optional as aggregated features won't have it
  aggregationLevel?: 'county' | 'city' | 'zip' | 'address';
  count?: number;
  label?: string;
  // Add other potential properties from backend aggregation
}
type VoterAddressFeature = Feature<Point, VoterAddressProperties>;
type SseStatus = 'connecting' | 'open' | 'closed';

// Define the shape of the state managed by the context
interface MapState {
  viewState: ViewState;
  setViewState: Dispatch<SetStateAction<ViewState>>;
  voterFeatures: VoterAddressFeature[];
  setVoterFeatures: Dispatch<SetStateAction<VoterAddressFeature[]>>;
  sseStatus: SseStatus;
  setSseStatus: Dispatch<SetStateAction<SseStatus>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  // State for API parameters derived from map view
  apiParams: {
    zoom: number;
    bounds: mapboxgl.LngLatBounds | null;
  };
  setApiParams: Dispatch<SetStateAction<{ zoom: number; bounds: mapboxgl.LngLatBounds | null }>>;
}

// Create the context with a default undefined value
const MapStateContext = createContext<MapState | undefined>(undefined);

// Define props for the provider
interface MapStateProviderProps {
  children: ReactNode;
  initialViewState?: Partial<ViewState>; // Allow overriding initial view
}

// Initial default view state (can be overridden by prop)
const defaultInitialViewState: ViewState = {
  longitude: -82.9,
  latitude: 32.7,
  zoom: 6.5,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

// Create the Provider component
export const MapStateProvider: React.FC<MapStateProviderProps> = ({ children, initialViewState }) => {
  const [viewState, setViewState] = useState<ViewState>({ ...defaultInitialViewState, ...initialViewState });
  const [voterFeatures, setVoterFeatures] = useState<VoterAddressFeature[]>([]);
  const [sseStatus, setSseStatus] = useState<SseStatus>('closed'); // Default to closed initially
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiParams, setApiParams] = useState<{ zoom: number; bounds: mapboxgl.LngLatBounds | null }>({
    zoom: viewState.zoom, // Initialize zoom from viewState
    bounds: null, // Bounds determined after map loads
  });

  const value = {
    viewState,
    setViewState,
    voterFeatures,
    setVoterFeatures,
    sseStatus,
    setSseStatus,
    isLoading,
    setIsLoading,
    apiParams,
    setApiParams,
  };

  return <MapStateContext.Provider value={value}>{children}</MapStateContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useMapState = (): MapState => {
  const context = useContext(MapStateContext);
  if (context === undefined) {
    throw new Error('useMapState must be used within a MapStateProvider');
  }
  return context;
}; 