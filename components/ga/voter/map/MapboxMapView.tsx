'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import Map, { Source, Layer, Popup, type MapRef, type ViewStateChangeEvent, type MapMouseEvent } from 'react-map-gl/mapbox';
import type { CircleLayerSpecification } from 'mapbox-gl';
import mapboxgl, { LngLatBounds } from 'mapbox-gl'; // Import LngLatBounds
import type { Feature, Point, FeatureCollection, Geometry } from 'geojson'; // Import Geometry type
import Link from 'next/link'; // Added Link for voter detail navigation
import { useMapState } from '@/context/MapStateContext'; // Import the context hook
import { useDebounceCallback } from 'usehooks-ts'; // Corrected import hook name
import { useVoterFilterContext, buildQueryParams } from '@/app/ga/voter/VoterFilterProvider'; // Import filter context and helper
import type { FilterState } from '@/app/ga/voter/list/types'; // Import FilterState type
import { ZOOM_COUNTY_LEVEL, ZOOM_ZIP_LEVEL } from '@/lib/map-constants'; // Import shared constants
import { VoterQuickview } from '@/components/ga/voter/quickview/VoterQuickview';
import { ParticipationScoreWidget } from '@/components/voter/ParticipationScoreWidget'; // Ensure widget is imported

// Define types for features (Keep these local or move to context if preferred)
interface VoterAddressProperties {
  address?: string;
  aggregationLevel?: 'county' | 'zip' | 'address'; // Removed 'city'
  count?: number;
  label?: string;
}
// Use generic Geometry for features, as they can now be Points or Polygons/MultiPolygons
type VoterAddressFeature = Feature<Geometry, VoterAddressProperties>;

// Define precise type for style object (Keep local)
type ReactMapGlCircleLayerStyle = Omit<CircleLayerSpecification, 'id' | 'type' | 'source'>;

// Define component props (Remove onLoadingChange)
interface MapboxMapViewProps {
  // Add other props as needed (e.g., map style)
}

// Define type for the detail API response (or import if defined elsewhere)
interface VoterDetail {
  registrationNumber: string;
  firstName: string;
  lastName: string;
}
interface VoterDetailResponse {
  address: string;
  voters: VoterDetail[];
}

// Extended PopupInfo to include hover state
interface PopupInfo {
  longitude: number;
  latitude: number;
  address: string;
  voters: VoterDetail[];
  isLoading: boolean;
}

// Add state for in-view stats
interface InViewStats {
  score: number | null;
  voterCount: number | null;
}

// Component using the context
const MapboxMapView: React.FC<MapboxMapViewProps> = () => {
  const mapRef = useRef<MapRef | null>(null);
  const isInitialLoadRef = useRef<boolean>(true); // Ref to track initial load (first time ever)
  const prevFiltersRef = useRef<FilterState | null>(null); // Ref for previous filters
  const controllerRef = useRef<AbortController | null>(null); // Store current fetch controller
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local state for tracking fetch queue
  const [fetchTrigger, setFetchTrigger] = useState<{
    type: 'initial' | 'filter' | 'bounds' | null;
    timestamp: number;
  }>({ type: null, timestamp: 0 });
  
  // Local state for tracking if a map is ready for fetching
  const [mapReady, setMapReady] = useState(false);

  // --- Popup State --- 
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  
  // Quickview state
  const [selectedVoter, setSelectedVoter] = useState<string | undefined>(undefined);
  const [isQuickviewOpen, setIsQuickviewOpen] = useState(false);

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
  const { filters, residenceAddressFilters, filtersHydrated } = useVoterFilterContext(); // Get current filters and address filters
  
  // --- State for In-View Stats ---
  const [inViewScoreData, setInViewScoreData] = useState<InViewStats | null>(null);

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
        // Close any open popup when filters change
        setPopupInfo(null);
        setInViewScoreData(null); // Clear score overlay on filter change
        
        // console.log('Filters changed, adding to fetch queue');
        setFetchTrigger({ type: 'filter', timestamp: Date.now() });
      }
    }
    // Update ref *after* comparison
    prevFiltersRef.current = JSON.parse(JSON.stringify(filters)); // Deep copy
  }, [filters, mapReady]);

  // --- Watch address filters and queue fetch when they change ---
  useEffect(() => {
    if (mapReady && !isInitialLoadRef.current) {
      // Close any open popup when address filters change
      setPopupInfo(null);
      setInViewScoreData(null); // Clear score overlay
      setFetchTrigger({ type: 'filter', timestamp: Date.now() });
    }
  }, [residenceAddressFilters, mapReady]);

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
      setIsLoading(false); // Ensure loading state is reset
      return;
    }
    
    const controller = new AbortController();
    controllerRef.current = controller;
    const signal = controller.signal;
    
    // Close popup and clear overlay when fetching new data (for bounds/filter changes)
    setPopupInfo(null);
    setInViewScoreData(null);
    
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

      // Use buildQueryParams from VoterFilterProvider to handle address filters
      const params = buildQueryParams(filters, residenceAddressFilters);
      params.forEach((value, key) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url.toString(), { signal });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      // Expect the new response structure
      const responseData = await response.json(); 
      const geojsonData: FeatureCollection<Geometry, VoterAddressProperties> = responseData.geoJson;
      const inViewStats: InViewStats = responseData.inViewStats;
      
      // console.log(`Fetch successful, received ${geojsonData.features.length} features.`);
      // console.log(`In-view stats:`, inViewStats);

      // Check if the fetch was aborted before updating state
      if (signal.aborted) {
        console.log('Fetch aborted before state update.');
        return; 
      }
      
      setVoterFeatures(geojsonData.features); // Update map features
      setInViewScoreData(inViewStats); // Update overlay stats
      
      // Fit bounds only on initial load or explicit filter change
      if ((fetchType === 'initial' || fetchType === 'filter') && geojsonData.features.length > 0) {
        try {
          const bounds = geojsonData.features.reduce((currentBounds, feature) => {
            if (!feature || !feature.geometry) return currentBounds;
            
            const geom = feature.geometry;
            
            // Function to extend bounds for a single coordinate pair
            const extendBounds = (coord: number[]) => {
              if (Array.isArray(coord) && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
                currentBounds.extend(coord as [number, number]);
              }
            };

            // Function to iterate through nested coordinate arrays
            const processCoords = (coords: any[]) => {
              if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
                // Reached an array of points [lng, lat]
                coords.forEach(extendBounds);
              } else if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
                 // Need to go deeper
                 coords.forEach(processCoords);
              }
            };

            if (geom.type === 'Point') {
              extendBounds(geom.coordinates);
            } else if (geom.type === 'Polygon' || geom.type === 'MultiPoint') {
              processCoords(geom.coordinates);
            } else if (geom.type === 'MultiPolygon') {
              geom.coordinates.forEach(processCoords); // Process each polygon within the MultiPolygon
            }
            // Add other geometry types (LineString, MultiLineString) if needed

            return currentBounds;
          }, new LngLatBounds());

          if (!bounds.isEmpty()) {
            // Add null check for mapRef.current
            if (mapRef.current) {
              const cameraOptions = mapRef.current.cameraForBounds(bounds, { padding: 60 });
              if (cameraOptions) {
                let targetZoom = cameraOptions.zoom ?? viewState.zoom;
                const targetCenter = cameraOptions.center ?? {lng: viewState.longitude, lat: viewState.latitude };
                
                // Threshold Capping Logic (Removed City Level)
                const ZOOM_THRESHOLDS = [ZOOM_COUNTY_LEVEL, ZOOM_ZIP_LEVEL]; // Removed City Level
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
                // Add null check for mapRef.current
                mapRef.current?.flyTo({
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
          }
        } catch (error) {
          console.error("Error during fitBounds/flyTo calculation or execution:", error);
          setIsFittingBounds(false);
        }
      } else {
         setIsFittingBounds(false); // Ensure this is reset if not fitting
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
        setInViewScoreData(null); // Clear overlay on error
        controllerRef.current = null;
      }
    } finally {
      // Ensure loading state is always reset unless fitting bounds is still active
      if (!isFittingBounds) {
          setIsLoading(false);
      }
      // Clear the controller ref once fetch completes or is aborted
      if (controllerRef.current === controller) {
          controllerRef.current = null;
      }
    }
  }, [apiParams, filters, residenceAddressFilters, setVoterFeatures, setIsLoading, setIsFittingBounds, viewState, setApiParams]);

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

  // --- Layer Styling (Keep address point styling) --- //
  const voterAddressPointStyle: ReactMapGlCircleLayerStyle = {
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        ZOOM_ZIP_LEVEL, 2, // At zoom 11 (start), radius is 2
        13.99, 2,          // Just before zoom 14, radius is still 2
        14, 4,             // At zoom 14, radius becomes 4
        // Radius stays 4 for higher zooms
      ],
      'circle-color': '#e55e5e', // Red color
      'circle-opacity': 0.7, // Keep opacity
      // Removed stroke properties
    }
  };

  // --- Polygon Fill Styles --- //
  // Define a color palette for zip codes
  const zipColorPalette = [
    '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', 
    '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'
    // Add more colors if needed
  ];
  
  const countyPolygonStyle: any = {
    paint: {
      'fill-color': '#fbb03b', // Orange for county
      'fill-opacity': 0.3,
      'fill-outline-color': '#ffffff', // White outline
      'fill-outline-width': 1 // Added width for visibility
    }
  };
  
  const zipPolygonStyle: any = {
    paint: {
      // Use a match expression based on the feature ID (modulo palette size)
      // Note: ['id'] accesses the top-level GeoJSON feature id we added in the backend
      'fill-color': [
        'match',
        ['%', ['to-number', ['id']], zipColorPalette.length], // Calculate id % palette.length
        ...zipColorPalette.flatMap((color, index) => [index, color]), // Create pairs [0, color1], [1, color2], ...
        '#cccccc' // Default fallback color
      ],
      'fill-opacity': 0.4, // Slightly increased opacity
      'fill-outline-color': '#ffffff',
      'fill-outline-width': 1 // Added width for visibility
    }
  };

  // --- Label Layer Style --- //
  const zipLabelStyle: any = {
      layout: {
          'text-field': ['get', 'label'], // Display the ZCTA from properties.label
          'text-size': 10,
          'text-allow-overlap': false,
          'symbol-placement': 'point' // Place label at the polygon's centroid (or representative point)
      },
      paint: {
          'text-color': '#ffffff', // White text
          'text-halo-color': '#000000', // Black halo
          'text-halo-width': 1
      }
  };

  // Create FeatureCollection for the Source component from context state
  // Type should now be FeatureCollection<Geometry, ...>
  const voterFeatureCollection: FeatureCollection<Geometry, VoterAddressProperties> = {
    type: 'FeatureCollection',
    // Cast voterFeatures to the correct local type definition
    features: voterFeatures as unknown as Feature<Geometry, VoterAddressProperties>[] 
  };

  // --- Function to fetch voter details for popup --- 
  const fetchVoterDetailsForPopup = useCallback(async (address: string, lngLat: mapboxgl.LngLat) => {
    // Set initial popup state (loading)
    setPopupInfo({
      longitude: lngLat.lng,
      latitude: lngLat.lat,
      address: 'Loading...', // Placeholder
      voters: [],
      isLoading: true,
    });

    try {
      const url = new URL('/api/ga/voter/details-at-location', window.location.origin);
      url.searchParams.append('address', address);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data: VoterDetailResponse = await response.json();

      // Update popup with fetched data
      setPopupInfo({
        longitude: lngLat.lng,
        latitude: lngLat.lat,
        address: data.address, // Use address from API response
        voters: data.voters,
        isLoading: false,
      });

    } catch (error) {
      console.error("Error fetching voter details for popup:", error);
      // Optionally show an error message in the popup or close it
      setPopupInfo(prev => prev ? { 
        ...prev, 
        address: "Error loading details.", 
        isLoading: false 
      } : null);
    }
  }, []);

  // --- Handler for clicking on a voter point --- 
  const handleVoterClick = useCallback(async (event: MapMouseEvent) => {
    if (!event.features || event.features.length === 0) {
      return; // No feature clicked
    }

    // Only proceed if the clicked feature is from the voter-points layer
    const voterPointFeature = event.features.find(f => f.layer?.id === 'voter-points');
    if (!voterPointFeature) {
      return;
    }
    
    // Cast to the correct type *after* confirming it exists
    const clickedFeature = voterPointFeature as VoterAddressFeature;
    const properties = clickedFeature.properties;
    const address = properties?.label;
    const lngLat = event.lngLat;

    if (!address) {
      console.warn('Clicked feature does not have a label (address) property.');
      return;
    }
    if (!lngLat) {
      console.warn('Could not get coordinates for clicked feature.');
      return;
    }

    // Call the fetch function (removed isHover parameter)
    fetchVoterDetailsForPopup(address, lngLat);
  }, [fetchVoterDetailsForPopup]);

  // ... (onMouseEnter, onMouseLeave handlers remain the same) ...

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        {...viewState} // Use viewState from context
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)} // Update context viewState
        onLoad={handleLoad} // Set initial API params on load
        onIdle={handleIdle} // Update API params when movement stops
        onClick={handleVoterClick} // Onclick handler for map features
        interactiveLayerIds={['voter-points']} // Specify interactive layers
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
          <Source
            id="voter-addresses"
            type="geojson"
            data={voterFeatureCollection} // Feed data from context
          >
            {/* Address Points Layer (visible only at high zoom) */}
            <Layer 
              id="voter-points" 
              type="circle" 
              minzoom={ZOOM_ZIP_LEVEL} // Only show when zoomed past zip level
              filter={['==', ['get', 'aggregationLevel'], 'address']}
              {...voterAddressPointStyle} 
            />
            
            {/* County Polygons Layer */}
            <Layer 
              id="county-polygons"
              type="fill"
              maxzoom={ZOOM_COUNTY_LEVEL} // Visible up to county level zoom
              filter={['==', ['get', 'aggregationLevel'], 'county']}
              {...countyPolygonStyle}
            />
            
            {/* Zip Polygons Layer */}
            <Layer 
              id="zip-polygons"
              type="fill"
              minzoom={ZOOM_COUNTY_LEVEL} // Adjusted minzoom to start after county
              maxzoom={ZOOM_ZIP_LEVEL}
              filter={['==', ['get', 'aggregationLevel'], 'zip']}
              {...zipPolygonStyle}
            />
            
            {/* Zip Labels Layer */}            
            <Layer
              id="zip-labels"
              type="symbol"
              minzoom={ZOOM_COUNTY_LEVEL} // Adjusted minzoom to start after county
              maxzoom={ZOOM_ZIP_LEVEL}
              filter={['==', ['get', 'aggregationLevel'], 'zip']}
              {...zipLabelStyle}            
            />
            
          </Source>

          {/* --- Popup Rendering --- */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="top"
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
              closeButton={true}
              style={{ zIndex: 10 }}
              className="voter-map-popup"
            >
              <div style={{ maxWidth: '300px', color: '#333' }}>
                {/* Format address on two lines */}
                <div style={{ 
                  margin: '0 0 12px 0',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '8px',
                  paddingRight: '5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '5px', color: '#555' }}>📍</span>
                    <div>
                      {/* Split address into components */}
                      {(() => {
                        const parts = popupInfo.address.split(',');
                        if (parts.length >= 2) {
                          return (
                            <>
                              <div style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#000' }}>
                                {parts[0].trim()}
                              </div>
                              <div style={{ fontSize: '0.9em', color: '#555' }}>
                                {parts.slice(1).join(',').trim()}
                              </div>
                            </>
                          );
                        } else {
                          return <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{popupInfo.address}</div>;
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {/* Rest of popup content */}
                {popupInfo.isLoading ? (
                  <p style={{ color: '#555' }}>Loading voters...</p>
                ) : popupInfo.voters.length > 0 ? (
                  <>
                    <div style={{ 
                      margin: '0 0 10px 0', 
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.9em',
                      fontWeight: 'bold',
                      color: '#1a56db',
                      backgroundColor: '#e1effe',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      <span style={{ marginRight: '5px' }}>👥</span>
                      <span>{popupInfo.voters.length} {popupInfo.voters.length === 1 ? 'voter' : 'voters'} at this address</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {popupInfo.voters.map((voter) => (
                        <li key={voter.registrationNumber} style={{ marginBottom: '6px' }}>
                          <div
                            onClick={() => {
                              setSelectedVoter(voter.registrationNumber);
                              setIsQuickviewOpen(true);
                            }}
                            style={{ 
                              color: '#d33',
                              textDecoration: 'none', 
                              cursor: 'pointer',
                              fontWeight: 'medium',
                              padding: '2px 0',
                              display: 'block'
                            }}
                          >
                            <span style={{ marginRight: '5px' }}>👤</span>
                            {voter.firstName} {voter.lastName}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p style={{ color: '#666' }}>No voters found at this address.</p>
                )}
              </div>
            </Popup>
          )}

          {/* Simplified popup styling */}
          <style jsx global>{`
            .voter-map-popup .mapboxgl-popup-close-button {
              color: #666;
              background: none;
              font-size: 18px;
              padding: 0;
              width: 18px;
              height: 18px;
              line-height: 16px;
              right: 5px;
              top: 4px;
              z-index: 2;
            }
            
            .voter-map-popup .mapboxgl-popup-content {
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
              position: relative;
            }

            .voter-map-popup .mapboxgl-popup-tip {
              border-bottom-color: white; /* For top anchored popup */
            }
          `}</style>
      </Map>
      {isQuickviewOpen && selectedVoter && (
        <VoterQuickview
          isOpen={isQuickviewOpen}
          voterId={selectedVoter}
          onClose={() => {
            setSelectedVoter(undefined);
            setIsQuickviewOpen(false);
          }}
        />
      )}

      {/* NEW: In-View Score Overlay */}
      <div className="absolute top-2 right-2 bg-background/80 p-1.5 rounded shadow-md text-xs">
        <div className="flex items-center gap-1.5">
           <span className="font-medium">In View:</span>
           <ParticipationScoreWidget 
             score={inViewScoreData?.score} 
             isLoading={isLoading} // Use main loading state for simplicity here
             size="small" 
           />
           <span className="text-muted-foreground">
             ({inViewScoreData?.voterCount ?? '...'} voters)
           </span>
           {/* TODO: Maybe add an error indicator if stats fetch failed? */} 
        </div>
      </div>
    </div>
  );
};

export default MapboxMapView; 