import { CoreTool, tool } from 'ai';
import { z } from 'zod';

// Define the schema for a single location input object
const locationInputSchema = z.object({
  address: z.string().optional().describe("A full street address (e.g., '123 Main St, Anytown, CA 12345')"),
  zipCode: z.string().optional().describe("A 5-digit or 9-digit US zip code (e.g., '90210', '90210-1234')"),
  city: z.string().optional().describe("City name (requires 'state' to also be provided)"),
  state: z.string().optional().describe("2-letter US state abbreviation (required if 'city' is provided)"),
  requestId: z.union([z.string(), z.number()]).optional().describe("Optional client-provided ID to correlate results")
}).refine(data => {
    // Basic validation: ensure at least one primary key is present 
    // and state is present if city is present. More specific validation is done by the API endpoint.
    const hasAddress = !!data.address;
    const hasZip = !!data.zipCode;
    const hasCity = !!data.city;
    if (!hasAddress && !hasZip && !hasCity) return false; // Need at least one primary
    if (hasCity && !data.state) return false; // Need state with city
    // Add more checks if desired, e.g., ensuring only one primary is set
    return true;
}, {
    message: "Input must contain address OR zipCode OR (city AND state)."
});

// Define the schema for the tool's parameters
const districtLookupParametersSchema = z.object({
  locations: z.array(locationInputSchema).min(1).max(50)
    .describe('An array of location objects to look up districts for. Max 50 items.')
});

// Define the main tool using the parameters schema type
export const districtLookupTool: CoreTool<
  typeof districtLookupParametersSchema, // Use the Zod schema type here
  any // Keep result type as any for now
> = tool({
  description: 'Looks up US Congressional and State Legislative districts for a batch of locations (address, zip code, or city/state). Always provide the full address if available.',
  parameters: districtLookupParametersSchema, // Pass the schema object here
  execute: async ({ locations }) => {
    console.log(`[districtLookupTool] Executing lookup for ${locations.length} locations.`);
    
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!apiUrl) {
      console.error('[districtLookupTool] Error: NEXT_PUBLIC_APP_URL is not set.');
      throw new Error('Application configuration error: Base URL not set.');
    }

    const endpoint = `${apiUrl}/api/districts/lookup/batch`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locations),
      });

      if (!response.ok) {
        // Try to get error details from API response body
        let errorBody = { message: `API request failed with status ${response.status}` };
        try {
           const body = await response.json();
           errorBody = body?.error || errorBody; 
        } catch (e) { /* ignore parsing error */ }
        console.error(`[districtLookupTool] API error: ${response.status}`, errorBody);
        throw new Error(errorBody.message);
      }

      const results = await response.json();
      console.log(`[districtLookupTool] Received ${results.length} results from API.`);
      return results; // Return the array of success/error objects from the API

    } catch (error: any) {
      console.error(`[districtLookupTool] Unexpected error: ${error.message}`);
      // Re-throw the error so it can potentially be handled by errorMessageTool
      throw error;
    }
  },
}); 