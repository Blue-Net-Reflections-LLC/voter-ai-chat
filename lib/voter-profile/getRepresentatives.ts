import { sql } from '@/lib/voter/db';

/**
 * Fetches representatives data for a voter from LegiEquity API.
 * LegiEquity API requires lat/lng to find representatives.
 */
export async function getRepresentatives(registration_number: string) {
  try {
    // First, fetch the voter's address information to get coordinates
    const voterResult = await sql`
      SELECT
        congressional_district,
        state_senate_district,
        state_house_district,
        ST_X(geom) as lng,
        ST_Y(geom) as lat
      FROM ga_voter_registration_list
      WHERE voter_registration_number = ${registration_number}
      LIMIT 1;
    `;

    if (voterResult.length === 0) {
      throw new Error('Voter not found');
    }

    const voter = voterResult[0];
    
    // Check if we have coordinates to make the API call
    if (!voter.lat || !voter.lng) {
      console.warn(`No coordinates found for voter ${registration_number}, using placeholder data`);
      // Return placeholder data if no coordinates available
      return createPlaceholderResponse(voter);
    }

    // Make request to LegiEquity API
    try {
      const url = new URL('https://legiequity.us/api/impact');
      url.searchParams.append('lat', voter.lat.toString());
      url.searchParams.append('lng', voter.lng.toString());
      url.searchParams.append('filter_type', 'sponsors');
      url.searchParams.append('impact_level', 'all');
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '10');

      console.log(`Fetching representatives for voter ${registration_number} at coordinates: ${voter.lat}, ${voter.lng}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`LegiEquity API returned status ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to match our expected format
      return transformApiResponse(data, voter);
    } catch (error) {
      console.error(`Error fetching from LegiEquity API:`, error);
      // Fall back to placeholder data if API call fails
      return createPlaceholderResponse(voter);
    }
  } catch (error) {
    // Handle errors
    console.error(`Error fetching representatives data:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error fetching representatives data');
  }
}

/**
 * Transform LegiEquity API response to our expected format
 */
function transformApiResponse(apiResponse: any, voter: any) {
  // Initialize arrays for the two categories
  const congressional: any[] = [];
  const state: any[] = [];
  
  // Track if we found any representatives in each category
  let foundCongressional = false;
  let foundStateSenate = false;
  let foundStateHouse = false;
  
  // Process representatives from the API response
  if (apiResponse.representatives && Array.isArray(apiResponse.representatives)) {
    apiResponse.representatives.forEach((rep: any) => {
      // Create a common format for our representatives
      const representative = {
        id: rep.id,
        name: rep.name,
        party_name: rep.party_name || rep.party,
        district: rep.district,
        chamber: rep.chamber,
        role: rep.role,
        votesmart_id: rep.votesmart_id,
        photo_url: rep.votesmart_id ? `https://static.votesmart.org/static/canphoto/${rep.votesmart_id}.jpg` : null,
        sponsor_page_url: `https://legiequity.us/sponsor/${rep.id}/${slugify(rep.name)}`
      };
      
      // Categorize representatives based on whether they're federal or state level
      // Federal representatives have state "US" or district that includes "GA"
      if (rep.state === 'US' || (rep.chamber?.toLowerCase().includes('house') && rep.district?.includes('GA'))) {
        // Congressional (federal) representative
        congressional.push(representative);
        foundCongressional = true;
      } else {
        // State level representative
        state.push(representative);
        
        // Track specific types for placeholder fallbacks
        if (rep.chamber?.toLowerCase().includes('senate')) {
          foundStateSenate = true;
        } else if (rep.chamber?.toLowerCase().includes('house')) {
          foundStateHouse = true;
        }
      }
    });
  }
  
  // Add placeholders if needed
  if (!foundCongressional && voter.congressional_district) {
    congressional.push({
      id: "placeholder",
      name: `Representative for ${voter.congressional_district}`,
      party_name: "Unknown",
      district: voter.congressional_district,
      chamber: "Congressional",
      role: "Representative",
      sponsor_page_url: "#"
    });
  }
  
  // Add state senate placeholder if needed
  if (!foundStateSenate && voter.state_senate_district) {
    state.push({
      id: "placeholder",
      name: `Senator for ${voter.state_senate_district}`,
      party_name: "Unknown",
      district: voter.state_senate_district,
      chamber: "State Senate",
      role: "Senator",
      sponsor_page_url: "#"
    });
  }
  
  // Add state house placeholder if needed
  if (!foundStateHouse && voter.state_house_district) {
    state.push({
      id: "placeholder",
      name: `Representative for ${voter.state_house_district}`,
      party_name: "Unknown",
      district: voter.state_house_district,
      chamber: "State House",
      role: "Representative",
      sponsor_page_url: "#"
    });
  }
  
  return {
    representatives: {
      congressional,
      state
    }
  };
}

/**
 * Create placeholder response structure when API is unavailable
 */
function createPlaceholderResponse(voter: any) {
  return {
    representatives: {
      congressional: voter.congressional_district ? [{
        id: "placeholder",
        name: `Representative for ${voter.congressional_district}`,
        party_name: "Unknown",
        district: voter.congressional_district,
        chamber: "Congressional",
        role: "Representative",
        sponsor_page_url: "#"
      }] : [],
      
      state: [
        ...(voter.state_senate_district ? [{
          id: "placeholder",
          name: `Senator for ${voter.state_senate_district}`,
          party_name: "Unknown",
          district: voter.state_senate_district,
          chamber: "State Senate",
          role: "Senator", 
          sponsor_page_url: "#"
        }] : []),
        
        ...(voter.state_house_district ? [{
          id: "placeholder",
          name: `Representative for ${voter.state_house_district}`,
          party_name: "Unknown",
          district: voter.state_house_district,
          chamber: "State House", 
          role: "Representative",
          sponsor_page_url: "#"
        }] : [])
      ]
    }
  };
}

/**
 * Helper to slugify a name for URL generation
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
} 