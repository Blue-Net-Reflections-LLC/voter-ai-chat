import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ResidenceAddressFilter } from '../../ResidenceAddressFilter';
import { GeographicFilterControlsProps, ResidenceAddressFilterState } from "./types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, X } from "lucide-react";

const RADIUS_OPTIONS = [
  { value: '0.028409', label: '150 feet' },
  { value: '0.056818', label: '300 feet' },
  { value: '0.113636', label: '600 feet' },
  { value: '0.25', label: '1/4 mile' },
  { value: '0.5', label: '1/2 mile' },
  { value: '1', label: '1 mile' },
  { value: '1.5', label: '1 1/2 miles' },
  { value: '2', label: '2 miles' },
  { value: '5', label: '5 miles' },
  { value: '10', label: '10 miles' },
];

// Helper function to format address for display
const formatAddressForDisplay = (feature: any): { short: string; full: string } => {
  const context = feature.context || [];
  let city = '';
  let state = '';
  let zipcode = '';

  // Extract city, state, and zipcode from context
  context.forEach((ctx: any) => {
    if (ctx.id?.includes('place')) {
      city = ctx.text;
    } else if (ctx.id?.includes('region')) {
      state = ctx.short_code?.replace('US-', '') || ctx.text;
    } else if (ctx.id?.includes('postcode')) {
      zipcode = ctx.text;
    }
  });

  // Get the full address from place_name and extract the street part
  const placeName = feature.place_name || '';
  const addressParts = placeName.split(',');
  
  // The first part usually contains the street number and name
  const streetAddress = addressParts[0]?.trim() || feature.text || '';
  
  // Format: "123 Main Street, Marietta, GA 30066"
  const shortFormat = [streetAddress, city, state, zipcode].filter(Boolean).join(', ');
  
  return {
    short: shortFormat,
    full: feature.place_name || shortFormat
  };
};

// Geocoding function using Mapbox
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number; } | null> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    // Restrict search to Georgia
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
      `access_token=${token}&` +
      `country=US&` +
      `bbox=-85.605166,30.355757,-80.751429,35.000771&` + // Georgia bounding box
      `limit=1`
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export function GeographicFilterControls({
  residenceAddressFilters,
  updateResidenceAddressFilter,
  addAddressFilter,
  removeAddressFilter,
  clearAllAddressFilters,
  radiusFilter,
  onRadiusFilterChange,
  onClearRadiusFilter
}: GeographicFilterControlsProps) {
  const [radiusAddress, setRadiusAddress] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('0.5'); // Default to 1/2 mile
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Parse current radius filter
  const currentRadius = radiusFilter ? radiusFilter.split(',') : null;
  const currentLat = currentRadius ? parseFloat(currentRadius[0]) : null;
  const currentLng = currentRadius ? parseFloat(currentRadius[1]) : null;
  const currentRadiusMiles = currentRadius ? currentRadius[2] : null;

  // Set initial radius if filter exists
  useEffect(() => {
    if (currentRadiusMiles) {
      setSelectedRadius(currentRadiusMiles);
    }
  }, [currentRadiusMiles]);

  // Generate static map URL with pin
  const getStaticMapUrl = (lat: number, lng: number, radius: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return null;

    const zoom = radius === '10' ? 11 : radius === '5' ? 12 : 13;
    const size = '300x200';
    const pin = `pin-s+e55e5e(${lng},${lat})`;
    
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pin}/${lng},${lat},${zoom}/${size}@2x?access_token=${token}`;
  };

  // Mapbox address suggestion search
  const searchAddresses = async (query: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${token}&` +
        `country=US&` +
        `bbox=-85.605166,30.357326,-80.751429,34.984749&` + // More restrictive Georgia bounding box
        `limit=5&` +
        `types=address&` + // Only addresses, no POIs
        `region=GA` // Prefer Georgia results
      );

      if (response.ok) {
        const data = await response.json();
        
        // Filter results to only include Georgia addresses
        const georgiaFeatures = (data.features || []).filter((feature: any) => {
          const context = feature.context || [];
          const hasGeorgia = context.some((ctx: any) => 
            ctx.id?.includes('region') && (ctx.short_code === 'US-GA' || ctx.text === 'Georgia')
          );
          return hasGeorgia;
        });
        
        setSuggestions(georgiaFeatures);
        
        // Calculate dropdown position
        if (inputRef.current) {
          const inputRect = inputRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: inputRect.bottom + window.scrollY,
            left: inputRect.left + window.scrollX,
            width: inputRect.width
          });
        }
        
        setShowSuggestions(georgiaFeatures.length > 0);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    }
  };

  const handleAddressChange = (value: string) => {
    setRadiusAddress(value);
    // Trigger search for suggestions (no filtering yet)
    searchAddresses(value);
  };

  const handleAddressSelect = async (address: string, feature?: any) => {
    let lat: number, lng: number;

    if (feature) {
      // Use coordinates from Mapbox feature
      [lng, lat] = feature.center;
    } else {
      // Geocode the entered address
      const coords = await geocodeAddress(address);
      if (!coords) {
        alert('Could not find location for the entered address.');
        return;
      }
      lat = coords.lat;
      lng = coords.lng;
    }

    // Clear address text since we only track coordinates
    setRadiusAddress('');
    setShowSuggestions(false);
    
    // Apply filter with current radius
    const radiusFilterValue = `${lat},${lng},${selectedRadius}`;
    onRadiusFilterChange(radiusFilterValue);
  };

  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          // Clear address text since we only track coordinates
          setRadiusAddress('');
          setShowSuggestions(false);
          
          // Apply filter with current radius
          const radiusFilterValue = `${lat},${lng},${selectedRadius}`;
          onRadiusFilterChange(radiusFilterValue);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter an address manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleRadiusChange = (radius: string) => {
    setSelectedRadius(radius);
    
    // If we have a location, update the filter immediately
    if (currentLat !== null && currentLng !== null) {
      const radiusFilterValue = `${currentLat},${currentLng},${radius}`;
      onRadiusFilterChange(radiusFilterValue);
    }
  };

  const handleClearRadius = () => {
    setRadiusAddress('');
    setSelectedRadius('0.5'); // Reset to default
    setSuggestions([]);
    setShowSuggestions(false);
    onClearRadiusFilter();
  };

  // Click outside to close suggestions and handle scroll/resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    // Handle scroll/resize to update position or hide dropdown
    const handleScrollOrResize = () => {
      if (showSuggestions && inputRef.current) {
        const inputRect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: inputRect.bottom + window.scrollY,
          left: inputRect.left + window.scrollX,
          width: inputRect.width
        });
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showSuggestions]);

  return (
    <>
      {/* Address Filters */}
      <ResidenceAddressFilter
        addressFilters={residenceAddressFilters}
        addAddressFilter={addAddressFilter}
        removeAddressFilter={removeAddressFilter}
        clearAllAddressFilters={clearAllAddressFilters}
        updateAddressFilter={(id, field, value) => {
          updateResidenceAddressFilter(id, field as keyof Omit<ResidenceAddressFilterState, 'id'>, value);
        }}
      />

      {/* Separator between Address Filters and Radius Search */}
      <div className="border-t border-border/30 pt-3 mt-3">
        {/* Radius Search */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Radius Search</Label>
          
          {/* Current filter display with static map */}
          {radiusFilter && currentLat !== null && currentLng !== null && (
            <div className="bg-muted/50 p-2 rounded space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Radius: {currentRadiusMiles} miles</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRadius}
                  className="h-6 w-6 p-0"
                >
                  <X size={12} />
                </Button>
              </div>
              
              {/* Static map with pin */}
              {(() => {
                const mapUrl = getStaticMapUrl(currentLat, currentLng, currentRadiusMiles || '1');
                return mapUrl ? (
                  <div className="relative">
                    <img 
                      src={mapUrl} 
                      alt={`Map showing radius search center at ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`}
                      className="w-full h-24 object-cover rounded border"
                      loading="lazy"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                      {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Address Input with Autocomplete - Hidden when filter is active */}
          {!radiusFilter && (
            <div className="space-y-2 relative">
              <Input
                ref={inputRef}
                placeholder="Enter Georgia address..."
                value={radiusAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setShowSuggestions(false);
                    handleAddressSelect(radiusAddress);
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    // Calculate dropdown position
                    if (inputRef.current) {
                      const inputRect = inputRef.current.getBoundingClientRect();
                      setDropdownPosition({
                        top: inputRect.bottom + window.scrollY,
                        left: inputRect.left + window.scrollX,
                        width: inputRect.width
                      });
                    }
                    setShowSuggestions(true);
                  }
                }}
              />
              
              {/* Use My Location Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseMyLocation}
                className="w-full"
              >
                <Navigation size={14} className="mr-2" />
                Use My Location
              </Button>
            </div>
          )}

          {/* Radius Selection - Hidden when filter is active */}
          {!radiusFilter && (
            <div className="space-y-2">
              <Label className="text-xs">Distance</Label>
              <Select value={selectedRadius} onValueChange={handleRadiusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select radius..." />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Address Suggestions Dropdown - Rendered via Portal */}
      {showSuggestions && suggestions.length > 0 && typeof document !== 'undefined' && createPortal(
        <div
          ref={suggestionsRef}
          className="fixed bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto z-[9999]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999
          }}
        >
          {suggestions.map((feature, index) => {
            const formattedAddress = formatAddressForDisplay(feature);
            return (
              <button
                key={index}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b border-border last:border-b-0"
                onClick={() => handleAddressSelect(formattedAddress.short, feature)}
              >
                <div className="font-medium">{formattedAddress.short}</div>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
} 