import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db'; // Ensure this path is correct
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
import { ZOOM_COUNTY_LEVEL, ZOOM_ZIP_LEVEL } from '@/lib/map-constants'; // Import shared constants

// --- Constants ---
const VOTER_TABLE = 'ga_voter_registration_list';
const COUNTY_TABLE = 'tl_2024_us_county';
const PLACE_TABLE = 'tl_2024_13_place';
const ZCTA_TABLE = 'tl_2024_us_zcta520';
const SCHEMA_NAME = process.env.PG_VOTERDATA_SCHEMA || 'public'; // Use environment variable or default

// --- Interfaces ---
interface MapDataRow {
  geometry: string; // GeoJSON string
  count: number;
  label: string | null;
  aggregation_level: 'county' | 'city' | 'zip' | 'address';
  voter_ids?: string[] | null;
  id?: string; // Add optional id field for polygons
}

// --- Main GET Handler (Refactored for standard fetch) ---
export async function GET(request: NextRequest) {
  console.log('Map data fetch request received (Standard Fetch)');
  const searchParams = request.nextUrl.searchParams;

  try { // Add top-level try-catch
    // --- Parse Parameters ---
    const zoom = parseFloat(searchParams.get('zoom') || '6.5');
    const minLng = parseFloat(searchParams.get('minLng') || '-85.6052');
    const minLat = parseFloat(searchParams.get('minLat') || '30.3579');
    const maxLng = parseFloat(searchParams.get('maxLng') || '-80.8397');
    const maxLat = parseFloat(searchParams.get('maxLat') || '35.0007');
    const boundsProvided = searchParams.has('minLng') && !isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat);

    // --- Build Sidebar Filter Clause ---
    const sidebarFilterSql = buildVoterListWhereClause(searchParams);
    let sidebarFilterConditions = 'TRUE';
    if (sidebarFilterSql && sidebarFilterSql.trim().startsWith('WHERE ')) {
      const conditionsOnly = sidebarFilterSql.trim().substring(6).trim();
      if (conditionsOnly.length > 0) {
        sidebarFilterConditions = `(${conditionsOnly})`;
      }
    }

    // --- Determine Aggregation Level & Build Query String ---
    let aggregationLevel: MapDataRow['aggregation_level'];
    let queryString: string = '';
    const envelopeExpr = boundsProvided ? `ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)` : 'NULL::geometry';
    const intersectsClause = (alias: string) => boundsProvided ? `AND ST_Intersects(${alias}.geom, ${envelopeExpr})` : '';

    if (zoom < ZOOM_COUNTY_LEVEL) {
      aggregationLevel = 'county';
      queryString = `
        SELECT ST_AsGeoJSON(c.geom) as geometry, 1 as count, c."NAME" as label, 'county' as aggregation_level, c."GEOID" as id
        FROM public.${COUNTY_TABLE} c
        WHERE c."STATEFP" = '13' ${intersectsClause('c')}
        AND EXISTS (SELECT 1 FROM ${SCHEMA_NAME}.${VOTER_TABLE} v WHERE v.county_fips = c."GEOID" ${intersectsClause('v')} AND ${sidebarFilterConditions})
        ORDER BY label
      `;
    } else if (zoom < ZOOM_ZIP_LEVEL) {
      aggregationLevel = 'zip';
       queryString = `
        SELECT ST_AsGeoJSON(z.geom) as geometry, 1 as count, z."ZCTA5CE20" as label, 'zip' as aggregation_level, z."ZCTA5CE20" as id
        FROM public.${ZCTA_TABLE} z
        WHERE TRUE ${intersectsClause('z')}
        AND EXISTS (SELECT 1 FROM ${SCHEMA_NAME}.${VOTER_TABLE} v WHERE v.zcta = z."ZCTA5CE20" AND ${sidebarFilterConditions})
        ORDER BY label
      `;
    } else { // Address Level
      aggregationLevel = 'address';
      queryString = `
        SELECT 
          ST_AsGeoJSON(t.geom) as geometry, 
          COUNT(t.voter_registration_number) as count,
          -- Create a full address label from components, handling nulls
          CONCAT_WS(' ', NULLIF(t.residence_street_number, ''), 
                         NULLIF(t.residence_pre_direction, ''), 
                         NULLIF(t.residence_street_name, ''), 
                         NULLIF(t.residence_street_type, ''), 
                         NULLIF(t.residence_post_direction, ''),
                         CASE WHEN t.residence_apt_unit_number IS NOT NULL AND t.residence_apt_unit_number != '' 
                              THEN CONCAT('# ', t.residence_apt_unit_number) 
                              ELSE NULL END) as street_address,
          t.residence_city,
          t.residence_zipcode,
          -- Add a full formatted address as 'label' for frontend compatibility
          CONCAT(
            CONCAT_WS(' ', NULLIF(t.residence_street_number, ''), 
                        NULLIF(t.residence_pre_direction, ''), 
                        NULLIF(t.residence_street_name, ''), 
                        NULLIF(t.residence_street_type, ''), 
                        NULLIF(t.residence_post_direction, ''),
                        CASE WHEN t.residence_apt_unit_number IS NOT NULL AND t.residence_apt_unit_number != '' 
                             THEN CONCAT('# ', t.residence_apt_unit_number) 
                             ELSE NULL END),
            ', ', t.residence_city, ', GA ', t.residence_zipcode
          ) as label,
          'address' as aggregation_level, 
          JSON_AGG(t.voter_registration_number) as voter_ids
        FROM ${SCHEMA_NAME}.${VOTER_TABLE} t
        WHERE t.geom IS NOT NULL ${intersectsClause('t')} AND ${sidebarFilterConditions}
        GROUP BY 
          -- Group by all distinct address components to prevent over-grouping
          t.geom, 
          t.residence_street_number,
          t.residence_pre_direction,
          t.residence_street_name, 
          t.residence_street_type,
          t.residence_post_direction,
          t.residence_apt_unit_number,
          t.residence_city,
          t.residence_zipcode
        ORDER BY street_address
      `;
    }

    if (!queryString) {
        console.error("Error: Could not determine query string for map data.");
        return NextResponse.json({ error: "Failed to build query" }, { status: 500 });
    }

    // console.log(`--- Executing Map Query (Zoom: ${zoom}, Level: ${aggregationLevel}) ---\n`, queryString);

    // --- Execute Query ---
    const rows = await sql.unsafe<MapDataRow[]>(queryString);

    // --- Format as GeoJSON FeatureCollection ---
    const features = rows.map(row => {
        let geometry = null;
        try {
             geometry = row.geometry ? JSON.parse(row.geometry) : null;
        } catch (e) {
            console.warn("Failed to parse geometry for row:", row.label, e);
        }
        return {
            type: 'Feature' as const, // Explicitly type as 'Feature'
            id: row.id ?? undefined, // Include the id if it exists (for polygons)
            geometry: geometry,
            properties: {
                count: row.count,
                label: row.label,
                aggregationLevel: row.aggregation_level,
                ...(row.voter_ids && { voter_ids: row.voter_ids }),
            },
        };
    }).filter(feature => feature.geometry !== null); // Filter out features with invalid geometry

    const featureCollection = {
        type: 'FeatureCollection' as const, // Explicitly type
        features: features,
    };

    console.log(`Map data fetch complete. Level: ${aggregationLevel}, Features returned: ${features.length}`);
    return NextResponse.json(featureCollection);

  } catch (error) {
      console.error("Error in map data API route:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 