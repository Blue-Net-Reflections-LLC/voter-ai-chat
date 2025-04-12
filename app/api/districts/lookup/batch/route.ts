import { NextRequest, NextResponse } from 'next/server';

// Constants (move to config or env vars later if needed)
const MAX_BATCH_SIZE = 50;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
// Remove API Key Set
// const VALID_API_KEYS = new Set([process.env.DISTRICT_LOOKUP_API_KEY]); 

// --- Helper Types ---
interface LocationInput {
  address?: string;
  zipCode?: string;
  city?: string;
  state?: string;
  requestId?: string | number;
}

interface GeocodeResult {
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  normalizedAddress: string | null;
}

interface DistrictResult {
  congressionalDistrict: string | null;
  stateLegislativeDistrictUpper: string | null;
  stateLegislativeDistrictLower: string | null;
}

interface SuccessResponseItem {
  requestId: string | number | null;
  status: 'success';
  query: { 
    address: string | null;
    zipCode: string | null;
    city: string | null;
    state: string | null;
   };
  normalizedAddress: string | null;
  coordinates: GeocodeResult['coordinates'];
  districts: DistrictResult;
}

interface ErrorResponseItem {
  requestId: string | number | null;
  status: 'error';
  error: {
    code: string;
    message: string;
  };
}

type ResponseItem = SuccessResponseItem | ErrorResponseItem;

interface CensusGeographyItem {
  STUSAB?: string;
  BASENAME?: string;
  NAME?: string;
  GEOID?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface CensusGeographies {
  [key: string]: Array<CensusGeographyItem>;
}

interface CensusApiResponse {
  result?: {
    geographies?: CensusGeographies;
  };
}

// --- Google Maps Geocoding Helper ---
async function geocodeWithGoogle(location: LocationInput): Promise<GeocodeResult> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API Key is not configured.');
    throw new Error('Server configuration error.'); // Internal error
  }

  let queryParam = '';
  if (location.address) {
    queryParam = `address=${encodeURIComponent(location.address)}`;
  } else if (location.zipCode) {
    queryParam = `components=postal_code:${encodeURIComponent(location.zipCode)}`;
    if(location.state) {
        queryParam += `|country:US|administrative_area:${encodeURIComponent(location.state)}`;
    }
  } else if (location.city && location.state) {
    queryParam = `components=locality:${encodeURIComponent(location.city)}|administrative_area:${encodeURIComponent(location.state)}|country:US`;
  } else {
      // This case should be caught by prior validation, but handle defensively
      throw Object.assign(new Error('Invalid input for geocoding'), { code: 'INVALID_INPUT' });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${queryParam}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry?.location;
      return {
        coordinates: location ? { latitude: location.lat, longitude: location.lng } : null,
        normalizedAddress: result.formatted_address || null,
      };
    } else {
        console.warn(`Google Geocoding failed for input. Status: ${data.status}, Error: ${data.error_message}`);
        throw Object.assign(new Error('Could not resolve the provided location (Google).'), { code: 'GOOGLE_GEOCODING_FAILED' });
    }
  } catch (error: any) {
      console.error('Error calling Google Maps API:', error);
      // Re-throw specific errors or a generic one
      if (error.code === 'GOOGLE_GEOCODING_FAILED') throw error;
      throw Object.assign(new Error('Error communicating with the location service (Google).'), { code: 'GOOGLE_API_ERROR' });
  }
}

// --- Census Geocoding Helper (Refactored for FIPS+District GEOID) ---
async function getDistrictsFromCensus(coordinates: GeocodeResult['coordinates']): Promise<DistrictResult> {
  if (!coordinates) {
    throw Object.assign(new Error('Missing coordinates for Census lookup.'), { code: 'CENSUS_GEOCODING_FAILED' });
  }

  console.log(`[Census Lookup] Using coordinates: Latitude=${coordinates.latitude}, Longitude=${coordinates.longitude}`);

  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${coordinates.longitude}&y=${coordinates.latitude}&benchmark=Public_AR_Current&vintage=Current_Current&layers=54,56,58&format=json`;
  console.log(`[Census Lookup] Requesting URL: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Census API returned status: ${response.status}`);
    }
    const data: CensusApiResponse = await response.json();

    const geographies = data?.result?.geographies;
    if (!geographies) {
      console.warn('[Census Lookup] No geographies object found in response.');
      throw Object.assign(new Error('Could not find district information for the location.'), { code: 'CENSUS_GEOCODING_FAILED' });
    }

    const districts: DistrictResult = {
      congressionalDistrict: null,
      stateLegislativeDistrictUpper: null,
      stateLegislativeDistrictLower: null,
    };

    // --- Extract Congressional District (Use GEOID) ---
    const possibleCongressionalKeys = [
      '119th Congressional Districts',
      '118th Congressional Districts', 
      'Congressional Districts'
    ];
    for (const key of possibleCongressionalKeys) {
      if (geographies[key]?.length > 0) {
        const cdData = geographies[key][0];
        if (cdData?.GEOID) { // Target GEOID
          districts.congressionalDistrict = cdData.GEOID;
          console.log(`[Census Lookup] Found Congressional District GEOID (${key}): ${districts.congressionalDistrict}`);
          break; // Found it
        }
      }
    }
    if (!districts.congressionalDistrict) {
        console.warn('[Census Lookup] Congressional District GEOID not found in expected layers.');
    }

    // --- Extract State Senate District (Upper - Use GEOID) ---
    for (const key in geographies) {
      if (key.includes('State Legislative Districts - Upper') && geographies[key]?.length > 0) {
        const sliduData = geographies[key][0];
        if (sliduData?.GEOID) { // Target GEOID
          districts.stateLegislativeDistrictUpper = sliduData.GEOID;
          console.log(`[Census Lookup] Found State Senate District GEOID (${key}): ${districts.stateLegislativeDistrictUpper}`);
          break; // Found it
        }
      }
    }
     if (!districts.stateLegislativeDistrictUpper) {
        console.warn('[Census Lookup] State Senate District GEOID not found in expected layers.');
    }

    // --- Extract State House District (Lower - Use GEOID) ---
    for (const key in geographies) {
      if (key.includes('State Legislative Districts - Lower') && geographies[key]?.length > 0) {
        const slidlData = geographies[key][0];
        if (slidlData?.GEOID) { // Target GEOID
          districts.stateLegislativeDistrictLower = slidlData.GEOID;
          console.log(`[Census Lookup] Found State House District GEOID (${key}): ${districts.stateLegislativeDistrictLower}`);
          break; // Found it
        }
      }
    }
     if (!districts.stateLegislativeDistrictLower) {
        console.warn('[Census Lookup] State House District GEOID not found in expected layers.');
    }

    // If after all checks, no districts were found, consider it a failure for this step
    if (!districts.congressionalDistrict && !districts.stateLegislativeDistrictUpper && !districts.stateLegislativeDistrictLower) {
       console.warn('[Census Lookup] Failed to extract any district GEOID information from response.');
       throw Object.assign(new Error('Could not parse district GEOID information from Census response.'), { code: 'CENSUS_GEOCODING_FAILED' });
    }

    return districts;

  } catch (error: any) {
    console.error('Error calling or processing Census API:', error);
    if (error.code === 'CENSUS_GEOCODING_FAILED') throw error;
    // Distinguish between API communication error and parsing error? Maybe not necessary for client.
    throw Object.assign(new Error('Error communicating with or parsing data from the district service (Census).'), { code: 'CENSUS_API_ERROR' });
  }
}

// --- Main POST Handler ---
export async function POST(request: NextRequest) {
  // Remove Authentication Check
  /*
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } },
      { status: 401 }
    );
  }
  */

  // Parse & Validate Batch Request
  let locations: LocationInput[];
  try {
    locations = await request.json();
    if (!Array.isArray(locations)) {
        throw new Error('Request body must be a JSON array.');
    }
    if (locations.length > MAX_BATCH_SIZE) {
        return NextResponse.json(
            { error: { code: 'BATCH_SIZE_EXCEEDED', message: `Maximum batch size exceeded (Limit: ${MAX_BATCH_SIZE}).` } },
            { status: 413 }
        );
    }
    if (locations.length === 0) {
        return NextResponse.json([]);
    }
  } catch (error) {
        return NextResponse.json(
            { error: { code: 'INVALID_BATCH_REQUEST', message: 'Invalid request format. Expected JSON array.' } },
            { status: 400 }
        );
  }

  // Process each location in parallel
  const results: ResponseItem[] = await Promise.all(
    locations.map(async (location): Promise<ResponseItem> => {
      const requestId = location.requestId ?? null;
      const query = { 
          address: location.address ?? null,
          zipCode: location.zipCode ?? null,
          city: location.city ?? null,
          state: location.state ?? null
      };

      try {
        // 3a. Validate individual input
        const primaryInputs = [location.address, location.zipCode, location.city].filter(Boolean);
        if (primaryInputs.length !== 1) {
          throw Object.assign(new Error('Must provide exactly one of: address, zipCode, city.'), { code: 'INVALID_INPUT' });
        }
        if (location.city && !location.state) {
          throw Object.assign(new Error('State is required when providing city.'), { code: 'INVALID_INPUT' });
        }
        if (location.zipCode && !/^\d{5}(-\d{4})?$/.test(location.zipCode)) {
            throw Object.assign(new Error('Invalid zip code format.'), { code: 'INVALID_INPUT' });
        }
         if (location.state && !/^[a-zA-Z]{2}$/.test(location.state)) {
            throw Object.assign(new Error('Invalid state format. Use 2-letter abbreviation.'), { code: 'INVALID_INPUT' });
        }

        // 3b. Google Geocoding
        const { coordinates, normalizedAddress } = await geocodeWithGoogle(location);

        // 3c. Census District Lookup
        const districts = await getDistrictsFromCensus(coordinates);

        // 3d/e. Format Success Response
        return {
          requestId,
          status: 'success',
          query,
          normalizedAddress,
          coordinates,
          districts,
        };
      } catch (error: any) {
        // 3e. Format Error Response
        const errorCode = error.code || 'INTERNAL_SERVER_ERROR'; // Default error code
        const errorMessage = error.message || 'An unexpected error occurred.';
        console.error(`Error processing item (requestId: ${requestId}): ${errorCode} - ${errorMessage}`);
        return {
          requestId,
          status: 'error',
          error: {
            code: errorCode,
            message: errorMessage,
          },
        };
      }
    })
  );

  // 4. Return Response Array
  return NextResponse.json(results);
} 