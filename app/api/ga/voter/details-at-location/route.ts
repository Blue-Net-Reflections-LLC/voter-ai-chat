import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Assuming db setup exists

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fullAddress = searchParams.get('address');

  if (!fullAddress) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

  try {
    // Parse the full address to extract the street part
    // Format expected: "123 MAIN ST, CITY, GA ZIP"
    const addressParts = fullAddress.split(',');
    
    if (addressParts.length < 2) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }
    
    // Extract the street part (first segment before first comma)
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

    // Use LIKE to do a fuzzy match on the street part
    // This allows for variations in how addresses might be stored or passed
    const result = await sql`
      SELECT
        voter_registration_number as registration_number,
        first_name,
        last_name,
        residence_street_number,
        residence_pre_direction,
        residence_street_name,
        residence_street_type,
        residence_post_direction,
        residence_apt_unit_number,
        residence_city,
        residence_zipcode
      FROM ga_voter_registration_list
      WHERE 
        -- Use a fuzzy match for the street portion
        CONCAT_WS(' ', 
          residence_street_number, 
          residence_pre_direction, 
          residence_street_name, 
          residence_street_type, 
          residence_post_direction,
          residence_apt_unit_number
        ) ILIKE ${`%${streetPart}%`}
        -- Add city and zip conditions if provided
        ${city ? sql`AND residence_city ILIKE ${`%${city}%`}` : sql``}
        ${zip ? sql`AND residence_zipcode = ${zip}` : sql``}
      ORDER BY last_name, first_name;
    `;

    const voters = result.map((row: any) => ({
      registrationNumber: row.registration_number,
      firstName: row.first_name,
      lastName: row.last_name,
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