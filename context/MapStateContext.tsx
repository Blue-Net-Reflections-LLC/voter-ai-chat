'use client';

import React, { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import type { ViewState } from 'react-map-gl/mapbox';
import type { Feature, Point, FeatureCollection, Geometry } from 'geojson';
import type mapboxgl from 'mapbox-gl'; // Import mapboxgl for LngLatBounds type

// Define types from MapboxMapView for features and status
interface VoterAddressProperties {
  address?: string; // Make optional as aggregated features won't have it
  aggregationLevel?: 'county' | 'city' | 'zip' | 'address';
  count?: number;
  label?: string;
  // Add other potential properties from backend aggregation
}
// Use generic Geometry type
type VoterAddressFeature = Feature<Geometry, VoterAddressProperties>;

// Define the shape of the state managed by the context
interface MapState {
  viewState: ViewState;
  setViewState: Dispatch<SetStateAction<ViewState>>;
  voterFeatures: VoterAddressFeature[]; // Use the updated type here
  setVoterFeatures: Dispatch<SetStateAction<VoterAddressFeature[]>>; // And here
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isFittingBounds: boolean;
  setIsFittingBounds: Dispatch<SetStateAction<boolean>>;
  // Keep apiParams if still needed by other parts or for future use
  apiParams: { zoom: number; bounds: mapboxgl.LngLatBounds | null };
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiParams, setApiParams] = useState<{ zoom: number; bounds: mapboxgl.LngLatBounds | null }>({
    zoom: viewState.zoom,
    bounds: null,
  });
  const [isFittingBounds, setIsFittingBounds] = useState<boolean>(false);

  const value = {
    viewState,
    setViewState,
    voterFeatures,
    setVoterFeatures,
    isLoading,
    setIsLoading,
    apiParams,
    setApiParams,
    isFittingBounds,
    setIsFittingBounds,
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