'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Map, Source, Layer, Popup, type MapRef, type ViewStateChangeEvent, type MapMouseEvent } from 'react-map-gl/mapbox';
import type { CircleLayerSpecification } from 'mapbox-gl';
import mapboxgl, { LngLatBounds } from 'mapbox-gl'; // Import LngLatBounds
import type { Feature, Point, FeatureCollection, Geometry } from 'geojson'; // Import Geometry type
import Link from 'next/link'; // Added Link for voter detail navigation
import { useTheme } from 'next-themes'; // Added useTheme import
import { useMapState } from '@/context/MapStateContext'; // Import the context hook
import { useDebounceCallback } from 'usehooks-ts'; // Corrected import hook name
import { useVoterFilterContext, buildQueryParams } from '@/app/ga/voter/VoterFilterProvider'; // Import filter context and helper
import type { FilterState } from '@/app/ga/voter/list/types'; // Import FilterState type
import { ZOOM_COUNTY_LEVEL, ZOOM_ZIP_LEVEL } from '@/lib/map-constants'; // Import shared constants
import { VoterQuickview } from '@/components/ga/voter/quickview/VoterQuickview';
import { ParticipationScoreWidget } from '@/components/voter/ParticipationScoreWidget'; // Ensure widget is imported
import { fetchEventSource, EventSourceMessage } from '@microsoft/fetch-event-source'; // Import the new library

// Define types for features (Keep these local or move to context if preferred)
interface VoterAddressProperties {
  address?: string;
  aggregationLevel?: 'county' | 'zip' | 'address'; // Removed 'city'
  count?: number;
  label?: string;
  id?: string | number; // Added id property
  // New properties for party affiliation based coloring
  hasDemocrat?: boolean;
  hasRepublican?: boolean;
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
  middleName?: string;
  lastName: string;
  aptNumber?: string;
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

// --- SVG and Image Name for Teardrop Icon ---
const teardropSvg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#000000"><path d="M50,0 C27.90861,0 10,17.90861 10,40 C10,70 50,100 50,100 C50,100 90,70 90,40 C90,17.90861 72.09139,0 50,0 Z"/></svg>';
const teardropImageName = 'teardrop-pin';

// --- Color Definitions for Party Affiliation ---
const colorDemocratOnly = '#007bff';     // Blue
const colorRepublicanOnly = '#e55e5e';   // Red (consistent with previous default)
const colorMixedDr = '#6f42c1';          // Purple
const colorOtherOrNeither = '#fd7e14';   // Orange

// --- Mapbox Expression for Party-Based Coloring ---
const partyColorExpression = [
  'case',
  ['all', ['to-boolean', ['get', 'hasDemocrat']], ['to-boolean', ['get', 'hasRepublican']]], colorMixedDr,
  ['==', ['to-boolean', ['get', 'hasDemocrat']], true], colorDemocratOnly,
  ['==', ['to-boolean', ['get', 'hasRepublican']], true], colorRepublicanOnly,
  colorOtherOrNeither // Default
];

const legendItems = [
  { color: colorDemocratOnly, label: 'Democrat Household' },
  { color: colorRepublicanOnly, label: 'Republican Household' },
  { color: colorMixedDr, label: 'Mixed Household (Dem, Rep)' },
  { color: colorOtherOrNeither, label: 'Other / Not Specified' },
];

// Component using the context
const MapboxMapView: React.FC<MapboxMapViewProps> = () => {
  const mapRef = useRef<MapRef | null>(null);
  const prevFiltersRef = useRef<FilterState | null>(null); // Keep for filter change detection if needed, or remove if useEffect handles all.
  const controllerRef = useRef<AbortController | null>(null);
  const isInitialLoadPendingRef = useRef<boolean>(true); // Flag for initial fitBounds
  const isUnboundedQueryRunningRef = useRef<boolean>(false); // Track unbounded query state
  
  const { theme } = useTheme(); // Get the current theme

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
    isLoading,
    setIsLoading,
    apiParams,
    setApiParams,
    isFittingBounds,
    setIsFittingBounds,
  } = useMapState();

  // Get state from contexts - IMPORTANT: filters and residenceAddressFilters are now direct dependencies for fetchData
  const { filters, residenceAddressFilters, filtersHydrated } = useVoterFilterContext();
  
  // --- State for In-View Stats ---
  const [inViewScoreData, setInViewScoreData] = useState<InViewStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // updateApiParams remains the same, used by handleIdle
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
        setApiParams({ zoom: newZoom, bounds: newBounds });
      }
    }
  }, [apiParams, setApiParams]);

  const debouncedUpdateApiParams = useDebounceCallback(updateApiParams, 500);

  const handleIdle = useCallback(() => {
    if (isFittingBounds) {
      return;
    }
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const newZoom = map.getZoom();
      const newBounds = map.getBounds();
      debouncedUpdateApiParams(newZoom, newBounds);
    }
  }, [isFittingBounds, debouncedUpdateApiParams]);

  const handleLoad = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setApiParams({
        zoom: map.getZoom(), 
        bounds: map.getBounds()
      });
      setMapReady(true);

      // Add teardrop image if it doesn't exist
      if (!map.hasImage(teardropImageName)) {
        const image = new Image(64, 64); // Nominal size, actual rendering controlled by icon-size
        image.onload = () => {
          // Check again in case of async operations or if map instance changed
          const currentMapInstance = mapRef.current?.getMap(); 
          if (currentMapInstance && !currentMapInstance.hasImage(teardropImageName)) {
            currentMapInstance.addImage(teardropImageName, image, { sdf: true });
            // console.log('Teardrop image added to map');
          }
        };
        image.onerror = () => {
          console.error('Error loading teardrop SVG for map.');
        };
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(teardropSvg);
      }
    }
  }, [setApiParams]);

  // --- Refactored Data Fetching using fetchEventSource ---
  const fetchData = useCallback(async (skipBounds = false) => {
    // console.log(`fetchData triggered${skipBounds ? ' (UNBOUNDED QUERY)' : ''} for SSE`);
    setIsLoading(true);
    setPopupInfo(null); // Close any open popups when new data is fetched

    if (controllerRef.current) {
      // console.log('Aborting previous fetchEventSource request');
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    const currentMap = mapRef.current?.getMap();
    if (!currentMap) {
      console.warn('Map not ready, skipping SSE fetch');
      setIsLoading(false);
      return;
    }
    
    // For zoom we always use current map zoom
    const zoom = currentMap.getZoom();
    
    // For bbox, we either use the current bounds or skip bounds entirely
    let bbox: string;
    
    if (skipBounds) {
      // Use all of Georgia (rough bounds) for unbounded query
      // These are the approximate bounds of Georgia
      bbox = "-85.605165,30.355644,-80.742567,35.000659";
      // console.log('Using Georgia-wide bounding box for unbounded query:', bbox);
    } else {
      // Use current map bounds
      const bounds = currentMap.getBounds();
      if (!bounds) {
        console.warn('Map bounds not available, skipping SSE fetch');
        setIsLoading(false);
        return;
      }
      bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    }

    // --- Build URL with filters ---
    const sseUrlParams = buildQueryParams(filters, residenceAddressFilters);
    sseUrlParams.set('zoom', zoom.toFixed(2));
    sseUrlParams.set('bbox', bbox);
    const sseUrl = `/api/ga/voter/map-data-sse?${sseUrlParams.toString()}`;
    // console.log('SSE Request URL:', sseUrl);

    let receivedFeatureIdsThisStream = new Set<string | number>(); // Tracks IDs for the current stream for final pruning
    let anyFeaturesReceived = false; // Track if we've received any features
    
    try {
      await fetchEventSource(sseUrl, {
        signal: controller.signal,
        onopen: async (response) => {
          // console.log('SSE Connection Opened for new query');
          if (!response.ok) {
             throw new Error(`SSE Connection Failed: ${response.status} ${response.statusText}`);
          }
          if (!response.headers.get('content-type')?.startsWith('text/event-stream')) {
            throw new Error(`SSE Invalid Content-Type: ${response.headers.get('content-type')}`);
          }
          receivedFeatureIdsThisStream.clear(); // Reset for the new stream
          anyFeaturesReceived = false; // Reset tracker
        },
        onmessage: (msg: EventSourceMessage) => {
          if (msg.event === 'end') {
            // The 'end' event is now primarily handled by onclose for pruning
            // console.log('SSE End event received.'); 
          } else if (msg.event === 'error') {
            console.error('SSE Error event received during stream:', msg.data);
            // Error handling will be in onerror, which might also trigger onclose
          } else { // Assumed to be feature data
            try {
              const batchData = JSON.parse(msg.data) as FeatureCollection;
              if (batchData && batchData.features && batchData.features.length > 0) {
                anyFeaturesReceived = true; // Flag that we received at least one feature
                
                const newFeaturesFromBatch = batchData.features as VoterAddressFeature[];
                
                newFeaturesFromBatch.forEach(feature => {
                  if (feature.properties?.id) { // Ensure feature has an ID in properties
                    receivedFeatureIdsThisStream.add(feature.properties.id);
                  }
                });
                // console.log(`SSE onmessage: receivedFeatureIdsThisStream size: ${receivedFeatureIdsThisStream.size} after adding from batch.`);

                setVoterFeatures(prevVoterFeatures => {
                  const featuresMap = new global.Map<string | number, VoterAddressFeature>(); // Explicitly use global.Map
                  // Populate map with previous features for efficient lookup/update
                  prevVoterFeatures.forEach(f => {
                    if (f.properties?.id) featuresMap.set(f.properties.id, f);
                  });
                  // Upsert new features from the batch
                  newFeaturesFromBatch.forEach(f => {
                    if (f.properties?.id) featuresMap.set(f.properties.id, f);
                  });
                  const newCombinedFeatures: VoterAddressFeature[] = Array.from(featuresMap.values()); // Explicitly type array
                  // console.log(`SSE Data: Upserted batch. Map now has ${newCombinedFeatures.length} features.`);
                  return newCombinedFeatures;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data event:', e, msg.data);
            }
          }
        },
        onclose: () => {
          // console.log(`SSE Connection Closed by server${skipBounds ? ' (unbounded query)' : ''}. Pruning features...`);
          setIsLoading(false);
          
          // console.log(`SSE onclose: receivedFeatureIdsThisStream size: ${receivedFeatureIdsThisStream.size} before pruning.`);

          setVoterFeatures(prevVoterFeatures => {
            if (controllerRef.current !== controller && controllerRef.current !== null) { 
              // console.log('SSE onclose: Belongs to an aborted stream, not pruning. Returning previous features.');
              // No need to fit bounds for aborted streams
              return prevVoterFeatures;
            }

            const filteredFeatures = prevVoterFeatures.filter(f => f.properties?.id && receivedFeatureIdsThisStream.has(f.properties.id));
            // console.log(`Pruning complete. Prev features: ${prevVoterFeatures.length}. Kept ${filteredFeatures.length} features that were part of this stream's ID set.`);
            
            // --- Handle the unbounded query results ---
            if (skipBounds) {
              isUnboundedQueryRunningRef.current = false; // Reset our tracking flag
              
              if (filteredFeatures.length > 0) {
                // console.log(`Unbounded query found ${filteredFeatures.length} features. Fitting bounds to them.`);
                
                // Fit bounds to these features
                const map = mapRef.current?.getMap();
                if (map) {
                  const bounds = new LngLatBounds();
                  filteredFeatures.forEach(feature => {
                    if (feature.geometry) {
                      if (feature.geometry.type === 'Point') {
                        bounds.extend(feature.geometry.coordinates as [number, number]);
                      } else if (feature.geometry.type === 'Polygon') {
                        feature.geometry.coordinates.forEach(ring => 
                          ring.forEach(coord => bounds.extend(coord as [number, number]))
                        );
                      } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(polygon => 
                          polygon.forEach(ring => 
                            ring.forEach(coord => bounds.extend(coord as [number, number]))
                          )
                        );
                      }
                    }
                  });

                  if (!bounds.isEmpty()) {
                    setIsFittingBounds(true);
                    map.once('moveend', () => {
                      // console.log('fitBounds moveend after unbounded query, setting isFittingBounds to false');
                      setIsFittingBounds(false);
                    });
                    map.fitBounds(bounds, {
                      padding: 40,
                      maxZoom: ZOOM_ZIP_LEVEL
                    });
                    // console.log('fitBounds called after unbounded query.');
                  }
                }
              } else {
                // console.log('Unbounded query returned no features. There are truly no matching results.');
              }
            } 
            // --- Handle the case where we need to try an unbounded query ---
            else if (!skipBounds && filteredFeatures.length === 0 && 
                     !isUnboundedQueryRunningRef.current && // Not already running unbounded query
                     !isInitialLoadPendingRef.current) { // Not initial load
              // No features in current view, immediately try an unbounded query
              // console.log('No features in current view. Automatically running unbounded query...');
              isUnboundedQueryRunningRef.current = true;
              
              // Small delay to ensure state updates are complete
              setTimeout(() => {
                fetchData(true); // Run fetchData with skipBounds=true
              }, 100);
            }
            
            // --- Fit bounds on initial load logic (MOVED INSIDE THE CALLBACK) ---
            if (isInitialLoadPendingRef.current && filteredFeatures.length > 0) {
              isInitialLoadPendingRef.current = false; 
              // console.log("Initial load complete with features, attempting to fit bounds based on pruned set.");

              const map = mapRef.current?.getMap();
              if (map) {
                const bounds = new LngLatBounds();
                filteredFeatures.forEach(feature => {
                  if (feature.geometry) {
                    if (feature.geometry.type === 'Point') {
                      bounds.extend(feature.geometry.coordinates as [number, number]);
                    } else if (feature.geometry.type === 'Polygon') {
                      feature.geometry.coordinates.forEach(ring => 
                        ring.forEach(coord => bounds.extend(coord as [number, number]))
                      );
                    } else if (feature.geometry.type === 'MultiPolygon') {
                      feature.geometry.coordinates.forEach(polygon => 
                        polygon.forEach(ring => 
                          ring.forEach(coord => bounds.extend(coord as [number, number]))
                        )
                      );
                    }
                  }
                });

                if (!bounds.isEmpty()) {
                  setIsFittingBounds(true); 
                  map.once('moveend', () => {
                    // console.log('fitBounds moveend, setting isFittingBounds to false');
                    setIsFittingBounds(false);
                  });
                  map.fitBounds(bounds, {
                    padding: 40, 
                    maxZoom: ZOOM_ZIP_LEVEL 
                  });
                  // console.log('fitBounds called.');
                } else {
                  // console.log('Calculated bounds (from pruned set) are empty, not fitting.');
                }
              } else {
                // console.log('Map instance not available for fitBounds.');
              }
            } else if (isInitialLoadPendingRef.current) {
              isInitialLoadPendingRef.current = false; 
              // console.log("Initial load complete with no features (after pruning), not fitting bounds.");
            }
            // --- End Fit bounds on initial load logic ---

            return filteredFeatures;
          });
          
          if (controllerRef.current === controller) {
             controllerRef.current = null;
          }
        },
        onerror: (err: any) => {
          console.error('SSE fetchEventSource Error:', err);
          if (err.name === 'AbortError') {
            // console.log('SSE Fetch aborted successfully.');
          } else {
            setIsLoading(false); 
            // Reset tracking flag if this was an unbounded query
            if (skipBounds) {
              isUnboundedQueryRunningRef.current = false;
            }
          }
          if (controllerRef.current === controller) { // Check if it's the current controller
             controllerRef.current = null;
          }
          if (err.name !== 'AbortError') {
              throw err; // Rethrow non-abort errors to be caught by outer try/catch
          }
        }
      });
    } catch (error: any) { 
         if (error.name !== 'AbortError') {
             console.error("Caught final error from fetchEventSource:", error);
             setIsLoading(false);
             
             // Reset tracking flag if this was an unbounded query
             if (skipBounds) {
               isUnboundedQueryRunningRef.current = false;
             }
         }
         // Ensure controllerRef is cleared if it's the one that errored/was aborted
         if (controllerRef.current === controller) {
             controllerRef.current = null;
         }
    }
  }, [
    filters, 
    residenceAddressFilters, 
    setIsLoading, 
    setVoterFeatures,
    // mapRef is stable, so not needed in deps. currentMap is derived from it.
    // zoom and bounds are derived inside, so apiParams not needed here if mapRef is source of truth at fetch time.
  ]);

  // --- New function to fetch map statistics ---
  const fetchMapStats = useCallback(async () => {
    // console.log('fetchMapStats triggered');
    setIsStatsLoading(true);

    const currentMap = mapRef.current?.getMap();
    if (!currentMap) {
      console.warn('Map not ready, skipping stats fetch');
      setIsStatsLoading(false);
      return;
    }
    const bounds = currentMap.getBounds();
    if (!bounds) {
      console.warn('Map bounds not available, skipping stats fetch');
      setIsStatsLoading(false);
      return;
    }
    const zoom = currentMap.getZoom(); // zoom is available from the map instance
    const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    const statsUrlParams = buildQueryParams(filters, residenceAddressFilters);
    // zoom is not strictly needed by the map-stats endpoint's SQL but can be passed for consistency or future use
    statsUrlParams.set('zoom', zoom.toFixed(2)); 
    statsUrlParams.set('bbox', bbox);
    const statsUrl = `/api/ga/voter/map-stats?${statsUrlParams.toString()}`;
    // console.log('Map Stats Request URL:', statsUrl);

    try {
      const response = await fetch(statsUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty obj
        throw new Error(`Failed to fetch map stats: ${response.status} ${response.statusText}. ${errorData.details || ''}`);
      }
      const stats: InViewStats = await response.json();
      // console.log('Map Stats Received:', stats);
      setInViewScoreData(stats);
    } catch (error) {
      console.error('Error fetching map stats:', error);
      setInViewScoreData(null); // Clear stats on error or set to an error state
    } finally {
      setIsStatsLoading(false);
    }
  }, [filters, residenceAddressFilters /* mapRef is stable */]);

  const debouncedFetchMapStats = useDebounceCallback(fetchMapStats, 200); // Slightly different debounce

  const debouncedFetchData = useDebounceCallback(fetchData, 150);

  // --- Main useEffect to trigger data fetching ---
  useEffect(() => {
    // Ensure filters are hydrated before initial fetch if they come from URL params initially
    if (!filtersHydrated) {
        // console.log('Fetch trigger skipped: filters not hydrated yet.');
        return;
    }
    if (!mapReady || isFittingBounds) {
      // console.log('Fetch trigger skipped: map not ready or fitting bounds.');
      return;
    }

    console.log('Data fetch trigger: mapReady, filters, map view (apiParams), or hydration changed.');
    debouncedFetchData();
    debouncedFetchMapStats(); // Call new stats fetcher

    // Cleanup function to abort fetch on unmount or when dependencies change
    return () => {
      if (controllerRef.current) {
        // console.log('Cleanup: Aborting fetch due to unmount or dependency change in main effect');
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [
    mapReady, 
    isFittingBounds, 
    debouncedFetchData, // Identity changes if fetchData's dependencies change
    filters, 
    residenceAddressFilters, 
    apiParams.zoom, // From map context, updated by onIdle
    apiParams.bounds, // From map context, updated by onIdle
    filtersHydrated,
    debouncedFetchMapStats
  ]);

  // --- Layer Styling (Keep address point styling) --- //
  const voterAddressPointStyle: ReactMapGlCircleLayerStyle = {
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        ZOOM_ZIP_LEVEL, 3,
        13.99, 3,
        14, 6,
        16, 8,
        16.79, 10
      ],
      'circle-color': partyColorExpression as any, // Use party color expression
      'circle-opacity': 0.7,
    }
  };

  // High-zoom marker style - main circle (bigger, lighter)
  const voterAddressHighZoomStyle: ReactMapGlCircleLayerStyle = {
    paint: {
      'circle-radius': 12,
      'circle-color': '#e55e5e',
      'circle-opacity': 0.6,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.8
    }
  };

  // High-zoom marker style - center dot (smaller, darker)
  // This will be removed, replaced by teardrop
  /*
  const voterAddressCenterDotStyle: ReactMapGlCircleLayerStyle = {
    paint: {
      'circle-radius': 4,
      'circle-color': '#d42020',
      'circle-opacity': 1
    }
  };
  */

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

    // Only proceed if the clicked feature is from one of our voter point layers
    const voterPointFeature = event.features.find(f =>
      f.layer?.id === 'voter-points' ||
      f.layer?.id === 'voter-points-teardrop' // Use new teardrop layer ID
    );
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
      {/* UPDATED: Loading Overlay to be a Top Bar with Text */}
      {isLoading && (
        <div 
          className="absolute top-0 left-0 right-0 h-10 z-50 flex items-center justify-center px-4 bg-gray-300/55 dark:bg-gray-700/55"
          // style={{ backgroundColor: 'rgba(0, 123, 255, 0.75)' }} // A noticeable blue, semi-transparent - REMOVED
        >
          <p className="text-gray-800 dark:text-gray-200 text-sm font-medium">Loading map data...</p>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        {...viewState} // Use viewState from context
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)} // Update context viewState
        onLoad={handleLoad} // Set initial API params on load
        onIdle={handleIdle} // Update API params when movement stops
        onClick={handleVoterClick} // Onclick handler for map features
        interactiveLayerIds={['voter-points', 'voter-points-teardrop']} // Updated to include teardrop layer
        style={{ width: '100%', height: '100%' }}
        mapStyle={theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11'} // Dynamically set map style
      >
          <Source
            id="voter-addresses"
            type="geojson"
            data={voterFeatureCollection} // Feed data from context
            promoteId="id" // Use feature.properties.id for efficient updates
          >
            {/* Address Points Layer (visible at medium zoom) */}
            <Layer 
              id="voter-points" 
              type="circle" 
              minzoom={ZOOM_ZIP_LEVEL} // Only show when zoomed past zip level
              maxzoom={16.8}          // Hide when we switch to high-zoom visualization
              filter={['==', ['get', 'aggregationLevel'], 'address']}
              {...voterAddressPointStyle} 
            />
            
            {/* High-zoom marker - Teardrop Icon (replaces previous two circle layers) */}
            <Layer 
              id="voter-points-teardrop" 
              type="symbol"
              minzoom={16.8}          // Only show at zoom > 16.8
              filter={['==', ['get', 'aggregationLevel'], 'address']}
              layout={{
                'icon-image': teardropImageName,
                'icon-size': 0.6, // Adjust size as needed (0.5 might be small, try 0.6 or 0.7)
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'icon-anchor': 'bottom',
              }}
              paint={{
                'icon-color': partyColorExpression as any, // Use party color expression
                'icon-opacity': 0.95,
              }}
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
              minzoom={ZOOM_COUNTY_LEVEL} 
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
                            {voter.firstName} {voter.middleName && voter.middleName.charAt(0) + '.'} {voter.lastName}
                            {voter.aptNumber && <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '3px' }}>
                              (#{voter.aptNumber})
                            </span>}
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
             isLoading={isStatsLoading || isLoading} // Combine loading states for the widget
             size="small" 
           />
           <span className="text-muted-foreground">
             ({inViewScoreData?.voterCount ?? '...'} voters)
           </span>
           {/* TODO: Maybe add an error indicator if stats fetch failed? */} 
        </div>
      </div>

      {/* NEW: Map Legend for Party Affiliation - Conditionally Rendered */}
      {viewState.zoom >= ZOOM_ZIP_LEVEL && (
        <div className="absolute top-10 right-2 bg-background/80 p-2 rounded shadow-md text-xs z-10">
          <div className="font-semibold mb-1 text-foreground">Voter Party Affiliation:</div>
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center mb-0.5">
              <span 
                className="w-3 h-3 inline-block mr-1.5 rounded-sm border border-black/20 dark:border-white/20"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapboxMapView; 