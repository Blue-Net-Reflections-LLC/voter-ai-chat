import { CoreTool, tool } from 'ai';
import { z } from 'zod';

// Define the schema for the tool's parameters
const geocodingParametersSchema = z.object({
  address: z.string().describe('A full street address (e.g., "123 Main St, Anytown, GA 30339")'),
  zipCode: z.string().optional().describe('A 5-digit or 9-digit US zip code (e.g., "30339")'),
  city: z.string().optional().describe('City name'),
  state: z.string().optional().describe('2-letter US state abbreviation (e.g., "GA")'),
}).refine(data => {
  // Ensure at least one parameter is provided
  return !!data.address || !!data.zipCode || (!!data.city && !!data.state);
}, {
  message: "At least one of: full address, zip code, or city+state combination must be provided"
});

// Define the main tool
export const geocodingTool: CoreTool<
  typeof geocodingParametersSchema,
  any
> = tool({
  description: 'Converts an address to latitude/longitude coordinates, which can be used with other location-based tools.',
  parameters: geocodingParametersSchema,
  execute: async ({ address, zipCode, city, state }) => {
    console.log(`[geocodingTool] Geocoding address: ${address || [city, state].filter(Boolean).join(', ') || zipCode}`);
    
    try {
      // Construct the search query
      let query = '';
      
      if (address) {
        query = address;
      } else if (city && state) {
        query = `${city}, ${state}`;
      } else if (zipCode) {
        query = zipCode;
      } else {
        throw new Error('Insufficient location information provided');
      }
      
      // Add additional components to refine the search if available
      if (!address && zipCode && (city || state)) {
        query = `${[city, state].filter(Boolean).join(', ')} ${zipCode}`;
      }
      
      // Get the Google Maps API key from environment
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }
      
      // Use Google Maps Geocoding API
      const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return {
          success: false,
          error: `Geocoding failed: ${data.status || 'No results found'}`,
          input: { address, zipCode, city, state }
        };
      }
      
      const result = data.results[0];
      return {
        success: true,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components,
        input: { address, zipCode, city, state }
      };
      
    } catch (error: any) {
      console.error(`[geocodingTool] Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        input: { address, zipCode, city, state }
      };
    }
  },
}); 