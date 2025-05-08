'use client';

import React, { createContext, useContext, useState, useMemo, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import type { ViewState as MapboxViewState } from 'react-map-gl/mapbox';
import type { Feature, Point, FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson';
import type mapboxgl from 'mapbox-gl'; // Import mapboxgl for LngLatBounds type
import type { LngLatBounds } from 'mapbox-gl';

// Corrected/Expected VoterAddressProperties definition
export interface VoterAddressProperties {
  address?: string;
  aggregationLevel?: 'county' | 'zip' | 'address'; // Ensure 'city' is not here if not used
  count?: number;
  label?: string;
  id?: string | number; // Ensure 'id' is present
}

// Use a more specific Geometry type if possible, or keep as generic Geometry
export type VoterAddressFeature = Feature<Geometry, VoterAddressProperties>;

// Interface for the map's view state
// export interface ViewState {
//   longitude: number;
//   latitude: number;
//   zoom: number;
//   pitch?: number;
//   bearing?: number;
//   padding?: mapboxgl.PaddingOptions;
// }

// Interface for API parameters used for fetching map data
export interface ApiParams {
  zoom: number;
  bounds: LngLatBounds | null;
}

// Define the shape of the context state
export interface MapStateContextType {
  viewState: MapboxViewState;
  setViewState: React.Dispatch<React.SetStateAction<MapboxViewState>>;
  voterFeatures: VoterAddressFeature[];
  setVoterFeatures: React.Dispatch<React.SetStateAction<VoterAddressFeature[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  apiParams: ApiParams;
  setApiParams: React.Dispatch<React.SetStateAction<ApiParams>>;
  isFittingBounds: boolean;
  setIsFittingBounds: React.Dispatch<React.SetStateAction<boolean>>;
  // Add other state and setters as needed
}

// Create the context with a default undefined value, forcing providers to supply it
const MapStateContext = createContext<MapStateContextType | undefined>(undefined);

// Define props for the provider
interface MapStateProviderProps {
  children: ReactNode;
  initialViewState?: Partial<MapboxViewState>; // Allow overriding initial view
}

// Initial default view state (can be overridden by prop)
const defaultInitialViewState: MapboxViewState = {
  longitude: -84.3880, // Default to Atlanta, GA
  latitude: 33.7490,
  zoom: 7,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 }
};

// Create the Provider component
export const MapStateProvider: React.FC<MapStateProviderProps> = ({ children, initialViewState }) => {
  const [viewState, setViewState] = useState<MapboxViewState>({ ...defaultInitialViewState, ...initialViewState });
  const [voterFeatures, setVoterFeatures] = useState<VoterAddressFeature[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiParams, setApiParams] = useState<ApiParams>({ zoom: defaultInitialViewState.zoom, bounds: null });
  const [isFittingBounds, setIsFittingBounds] = useState<boolean>(false);

  const contextValue = useMemo(() => ({
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
  }), [viewState, voterFeatures, isLoading, apiParams, isFittingBounds]);

  return <MapStateContext.Provider value={contextValue}>{children}</MapStateContext.Provider>;
};

// Create a custom hook for easy context consumption
export const useMapState = (): MapStateContextType => {
  const context = useContext(MapStateContext);
  if (context === undefined) {
    throw new Error('useMapState must be used within a MapStateProvider');
  }
  return context;
}; 