import { CoreTool, tool } from 'ai';
import { z } from 'zod';

// Define the schema for the tool's parameters
const impactLookupParametersSchema = z.object({
  lat: z.number().describe('Latitude coordinate for the impact lookup'),
  lng: z.number().describe('Longitude coordinate for the impact lookup'),
  filter_type: z.enum(['all', 'bills', 'sponsors']).optional().default('all')
    .describe('Type of impact items to filter by: "all", "bills", or "sponsors"'),
  impact_level: z.enum(['all', 'high', 'medium', 'neutral']).optional().default('all')
    .describe('Impact level filter: "all", "high", "medium", or "neutral"'),
  page: z.number().positive().int().optional().default(1)
    .describe('Page number for pagination (starts at 1)'),
  limit: z.number().positive().int().optional().default(20)
    .describe('Number of results per page (between 1 and 100)')
});

// Define the main tool using the parameters schema
export const impactLookupTool: CoreTool<
  typeof impactLookupParametersSchema,
  any // Keep result type as any for now
> = tool({
  description: 'Looks up legislative and civic impact information (bills, sponsors) for a specific location based on coordinates.',
  parameters: impactLookupParametersSchema,
  execute: async ({ lat, lng, filter_type, impact_level, page, limit }) => {
    console.log(`[impactLookupTool] Executing lookup for coordinates (${lat}, ${lng})`);
    
    try {
      // Construct query parameters for the URL
      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        filter_type: filter_type || 'all',
        impact_level: impact_level || 'all',
        page: (page || 1).toString(),
        limit: (limit || 20).toString()
      });
      
      // Construct the endpoint URL
      const endpoint = `https://legiequity.us/api/impact?${queryParams.toString()}`;
      
      console.log(`[impactLookupTool] Requesting data from: ${endpoint}`);
      
      // Make the API request
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Try to get error details from API response
        let errorBody = { message: `API request failed with status ${response.status}` };
        try {
          const body = await response.json();
          // Assuming the API might return error details in a specific format
          errorBody.message = body?.message || body?.error?.message || errorBody.message;
        } catch (e) { /* ignore parsing error */ }
        
        console.error(`[impactLookupTool] API error: ${response.status}`, errorBody);
        throw new Error(errorBody.message);
      }

      const results = await response.json();
      // Log based on actual API response structure (assuming results.data)
      console.log(`[impactLookupTool] Received results from API. Pagination: ${JSON.stringify(results.pagination)}`);
      
      return results;

    } catch (error: any) {
      console.error(`[impactLookupTool] Unexpected error: ${error.message}`);
      // Re-throw the error so it can potentially be handled by errorMessageTool
      throw error;
    }
  },
}); 