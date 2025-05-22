import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Assuming db setup exists

// Define all possible street types based on our database query results
const STREET_TYPES = [
  // Most common types
  'DR', 'RD', 'CT', 'LN', 'WAY', 'CIR', 'PKWY', 'TRL', 'PL', 'ST', 
  'TRCE', 'AVE', 'BLVD', 'TER', 'WALK', 'XING', 'RUN', 'RDG', 'PT', 'PASS',
  // Less common types
  'CV', 'BND', 'CHSE', 'GTWY', 'LNDG', 'VW', 'PTE', 'GLN', 'SQ', 'CONN',
  'HWY', 'PATH', 'OVL', 'PARK', 'CMNS', 'BLF', 'ML', 'ROW', 'GRN', 'CLO',
  'CRK', 'EXT', 'CTS', 'BRG', 'MNR', 'STA', 'CRST', 'ALY', 'SPGS', 'LOOP',
  // Rare types
  'KNL', 'HL', 'KNLS', 'BR', 'VLY', 'SMT', 'MALL', 'PND', 'COR', 'FRST',
  'EST', 'HOLW', 'CUT', 'GRV', 'CLB', 'CRSE', 'HTS', 'PLZ', 'BAY', 'CMN',
  'JCT', 'CRES', 'MDWS', 'LK', 'HLS', 'BRW', 'GDNS', 'N/A'
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fullAddress = searchParams.get('address');

  if (!fullAddress) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    // Parse the full address to extract the street part
    // Format expected: "123 MAIN ST, CITY, GA ZIP" but we'll handle variations
    const addressParts = fullAddress.split(',');
    
    // Always use at least the first part as street, even if there are no commas
    const streetPart = addressParts[0].trim();
    
    // Extract city from the second part (if present)
    let city = addressParts.length > 1 ? addressParts[1].trim() : '';
    // Remove "GA" if it's part of the city segment
    city = city.replace(/\s*GA\s*/, '').trim();
    
    // Extract zip from the last part (if present)
    let zip = '';
    if (addressParts.length > 2) {
      const lastPart = addressParts[addressParts.length - 1].trim();
      const zipMatch = lastPart.match(/\d{5}/);
      if (zipMatch) {
        zip = zipMatch[0];
      }
    }

    // Parse street part to better handle unit/apt numbers
    // The format might be "296 E BURNS CT SW # A" or "299 E BURNS CT SW # APT B" or similar
    let streetNumber = '';
    let streetName = '';
    let aptNumber = '';
    
    // First try to extract street number (the first number sequence)
    const streetNumberMatch = streetPart.match(/^\d+/);
    if (streetNumberMatch) {
      streetNumber = streetNumberMatch[0];
      
      // The rest is potentially street name + unit info
      const remaining = streetPart.substring(streetNumberMatch[0].length).trim();

      // Enhanced pattern to handle more apartment formats:
      // - #A, # A, #APT A, # APT A, APT A, UNIT B, etc.
      const aptMatch = remaining.match(/#\s*(?:APT\s*)?([A-Za-z0-9-]+)|\b(?:APT|UNIT|STE|SUITE)\s+([A-Za-z0-9-]+)/i);
      if (aptMatch) {
        // Get whichever group matched (either the direct unit number or the one after APT/UNIT keyword)
        aptNumber = (aptMatch[1] || aptMatch[2] || '').trim();
        // Remove the apt portion from street name
        streetName = remaining.replace(/#\s*(?:APT\s*)?([A-Za-z0-9-]+)|\b(?:APT|UNIT|STE|SUITE)\s+([A-Za-z0-9-]+)/i, '').trim();
      } else {
        streetName = remaining;
      }
    } else {
      streetName = streetPart; // No street number found
    }

    // Try to extract key parts of the street name for better matching
    const streetNameParts = streetName.split(/\s+/);
    
    // Extract pre-direction (if present)
    let preDirection = '';
    if (streetNameParts.length > 0 && /^[EWNS]$/i.test(streetNameParts[0])) {
      preDirection = streetNameParts[0].toUpperCase();
      streetNameParts.shift(); // Remove the directional
    }
    
    // Extract post-direction (if present)
    let postDirection = '';
    if (streetNameParts.length > 0 && /^[EWNS]$/i.test(streetNameParts[streetNameParts.length - 1])) {
      postDirection = streetNameParts[streetNameParts.length - 1].toUpperCase();
      streetNameParts.pop(); // Remove the directional
    }
    
    // The main street name is likely to be the part before "ST", "AVE", "CT", etc.
    let mainStreetName = '';
    let streetType = '';
    
    // Check if there's a street type to identify
    const streetTypeRegex = new RegExp(`^(${STREET_TYPES.join('|')})$`, 'i');
    const streetTypeIndex = streetNameParts.findIndex(part => streetTypeRegex.test(part));
    
    if (streetTypeIndex > -1) {
      streetType = streetNameParts[streetTypeIndex].toUpperCase();
      // Main street name is everything before the street type
      mainStreetName = streetNameParts.slice(0, streetTypeIndex).join(' ');
      // Remove street type from remaining parts
      streetNameParts.splice(streetTypeIndex, 1);
    } else if (streetNameParts.length > 0) {
      // If no street type found, assume the main name is all remaining parts
      mainStreetName = streetNameParts.join(' ');
    }

    // Try to find similar addresses first - let's do a query that looks for houses on the same street
    // Get addresses with similar street name to establish pattern
    const streetSearchQuery = sql`
      SELECT DISTINCT
        residence_street_number,
        residence_pre_direction,
        residence_street_name,
        residence_street_type,
        residence_post_direction,
        residence_city,
        residence_zipcode,
        COUNT(*) as voter_count
      FROM ga_voter_registration_list
      WHERE 
        ${mainStreetName ? sql`residence_street_name = ${mainStreetName}` : sql`TRUE`}
        ${streetType ? sql`AND residence_street_type = ${streetType}` : sql``}
        ${preDirection ? sql`AND residence_pre_direction = ${preDirection}` : sql``}
        ${postDirection ? sql`AND residence_post_direction = ${postDirection}` : sql``}
        ${city ? sql`AND residence_city ILIKE ${`%${city}%`}` : sql``}
        ${zip ? sql`AND residence_zipcode = ${zip}` : sql``}
      GROUP BY 
        residence_street_number,
        residence_pre_direction,
        residence_street_name,
        residence_street_type,
        residence_post_direction,
        residence_city,
        residence_zipcode
      ORDER BY voter_count DESC
      LIMIT 10;
    `;

    const similarAddresses = await streetSearchQuery;

    // Now do the main query with potentially better street information
    // Construct query with more detailed debug info
    const query = sql`
      SELECT
        voter_registration_number as registration_number,
        first_name,
        middle_name,
        last_name,
        residence_street_number,
        residence_pre_direction,
        residence_street_name,
        residence_street_type,
        residence_post_direction,
        residence_apt_unit_number,
        residence_city,
        residence_zipcode,
        CONCAT_WS(' ', 
          residence_street_number, 
          residence_pre_direction, 
          residence_street_name, 
          residence_street_type, 
          residence_post_direction,
          residence_apt_unit_number
        ) AS full_street_address
      FROM ga_voter_registration_list
      WHERE 
        -- EXACT street number matching only - no fuzzy matching
        ${streetNumber ? sql`residence_street_number = ${streetNumber}` : sql`TRUE`}
        
        -- Match exact street name
        ${mainStreetName ? sql`AND residence_street_name = ${mainStreetName}` : sql`AND TRUE`}
        
        -- Match pre-direction if available
        ${preDirection ? sql`AND residence_pre_direction = ${preDirection}` : sql`AND TRUE`}
        
        -- Match street type exactly when available
        ${streetType ? sql`AND residence_street_type = ${streetType}` : sql`AND TRUE`}
        
        -- Match post-direction if available
        ${postDirection ? sql`AND residence_post_direction = ${postDirection}` : sql`AND TRUE`}
        
        -- Match apartment/unit number if provided
        ${aptNumber ? sql`AND residence_apt_unit_number ILIKE ${aptNumber}` : sql``}
        
        -- Add city and zip conditions if provided (exact zip matching)
        ${city ? sql`AND residence_city ILIKE ${`%${city}%`}` : sql``}
        ${zip ? sql`AND residence_zipcode = ${zip}` : sql``}
      ORDER BY 
        residence_street_number ASC
      LIMIT 100;
    `;
    
    const result = await query;

    const voters = result.map((row: any) => ({
      registrationNumber: row.registration_number,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      aptNumber: row.residence_apt_unit_number
    }));

    // Reconstruct the canonical address from components for display
    const reconstructAddress = (row: any) => {
      const streetParts = [
        row.residence_street_number,
        row.residence_pre_direction, 
        row.residence_street_name,
        row.residence_street_type,
        row.residence_post_direction
      ].filter(Boolean).join(' ');
      
      const apt = row.residence_apt_unit_number 
        ? `#${row.residence_apt_unit_number}` 
        : '';

      return `${streetParts}${apt ? ' ' + apt : ''}, ${row.residence_city}, GA ${row.residence_zipcode}`;
    };

    // Use the first result's components to create a canonical address
    const canonicalAddress = result.length > 0
      ? reconstructAddress(result[0])
      : fullAddress; // Fallback to input if no matches

    return NextResponse.json({
      address: canonicalAddress,
      voters: voters
    });

  } catch (error) {
    console.error('Error fetching voter details by address:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 