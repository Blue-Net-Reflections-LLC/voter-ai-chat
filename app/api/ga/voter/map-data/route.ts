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

  try {
    // --- Parse Parameters ---
    const zoom = parseFloat(searchParams.get('zoom') || '6.5');
    const minLng = parseFloat(searchParams.get('minLng') || '-85.6052');
    const minLat = parseFloat(searchParams.get('minLat') || '30.3579');
    const maxLng = parseFloat(searchParams.get('maxLng') || '-80.8397');
    const maxLat = parseFloat(searchParams.get('maxLat') || '35.0007');
    const boundsProvided = searchParams.has('minLng') && !isNaN(minLng) && !isNaN(minLat) && !isNaN(maxLng) && !isNaN(maxLat);

    // --- Build COMBINED WHERE Clause (Sidebar Filters + Spatial Filter) ---
    // 1. Sidebar Filters
    const sidebarFilterSql = buildVoterListWhereClause(searchParams);
    let sidebarFilterConditions = 'TRUE';
    if (sidebarFilterSql && sidebarFilterSql.trim().startsWith('WHERE ')) {
      const conditionsOnly = sidebarFilterSql.trim().substring(6).trim();
      if (conditionsOnly.length > 0) {
        sidebarFilterConditions = `(${conditionsOnly})`;
      }
    }

    // 2. Spatial Filter
    const envelopeExpr = boundsProvided ? `ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)` : 'NULL::geometry';
    const spatialFilterCondition = (alias: string) => boundsProvided ? `ST_Intersects(${alias}.geom, ${envelopeExpr})` : 'TRUE';

    // 3. Combine them for voter table queries
    const finalVoterWhereClause = `WHERE ${sidebarFilterConditions} AND ${spatialFilterCondition('v')} AND v.geom IS NOT NULL`;
    const finalVoterConditionsOnly = `(${sidebarFilterConditions} AND ${spatialFilterCondition('v')} AND v.geom IS NOT NULL)`; // Without WHERE for EXISTS etc.

    // --- Determine Aggregation Level & Build GeoJSON Query String ---
    let aggregationLevel: MapDataRow['aggregation_level'];
    let geoJsonQueryString: string = '';

    if (zoom < ZOOM_COUNTY_LEVEL) {
      aggregationLevel = 'county';
      // Use finalVoterConditionsOnly inside EXISTS
      geoJsonQueryString = `
        SELECT ST_AsGeoJSON(c.geom) as geometry, 1 as count, c."NAME" as label, 'county' as aggregation_level, c."GEOID" as id
        FROM public.${COUNTY_TABLE} c
        WHERE c."STATEFP" = '13' AND ${spatialFilterCondition('c')}
        AND EXISTS (SELECT 1 FROM ${SCHEMA_NAME}.${VOTER_TABLE} v WHERE v.county_fips = c."GEOID" AND ${finalVoterConditionsOnly})
        ORDER BY label
      `;
    } else if (zoom < ZOOM_ZIP_LEVEL) {
      aggregationLevel = 'zip';
       // Use finalVoterConditionsOnly inside EXISTS
       geoJsonQueryString = `
        SELECT ST_AsGeoJSON(z.geom) as geometry, 1 as count, z."ZCTA5CE20" as label, 'zip' as aggregation_level, z."ZCTA5CE20" as id
        FROM public.${ZCTA_TABLE} z
        WHERE ${spatialFilterCondition('z')}
        AND EXISTS (SELECT 1 FROM ${SCHEMA_NAME}.${VOTER_TABLE} v WHERE v.zcta = z."ZCTA5CE20" AND ${finalVoterConditionsOnly})
        ORDER BY label
      `;
    } else { // Address Level
      aggregationLevel = 'address';
      // Apply finalVoterWhereClause directly to the main query
      geoJsonQueryString = `
        SELECT 
          ST_AsGeoJSON(v.geom) as geometry, 
          COUNT(v.voter_registration_number) as count,
          CONCAT_WS(' ', NULLIF(v.residence_street_number, ''), 
                         NULLIF(v.residence_pre_direction, ''), 
                         NULLIF(v.residence_street_name, ''), 
                         NULLIF(v.residence_street_type, ''), 
                         NULLIF(v.residence_post_direction, ''),
                         CASE WHEN v.residence_apt_unit_number IS NOT NULL AND v.residence_apt_unit_number != '' 
                              THEN CONCAT('# ', v.residence_apt_unit_number) 
                              ELSE NULL END) as street_address,
          v.residence_city,
          v.residence_zipcode,
          CONCAT(
            CONCAT_WS(' ', NULLIF(v.residence_street_number, ''), 
                        NULLIF(v.residence_pre_direction, ''), 
                        NULLIF(v.residence_street_name, ''), 
                        NULLIF(v.residence_street_type, ''), 
                        NULLIF(v.residence_post_direction, ''),
                        CASE WHEN v.residence_apt_unit_number IS NOT NULL AND v.residence_apt_unit_number != '' 
                             THEN CONCAT('# ', v.residence_apt_unit_number) 
                             ELSE NULL END),
            ', ', v.residence_city, ', GA ', v.residence_zipcode
          ) as label,
          'address' as aggregation_level, 
          JSON_AGG(v.voter_registration_number) as voter_ids
        FROM ${SCHEMA_NAME}.${VOTER_TABLE} v
        ${finalVoterWhereClause} -- Use combined WHERE clause
        GROUP BY 
          v.geom, 
          v.residence_street_number,
          v.residence_pre_direction,
          v.residence_street_name, 
          v.residence_street_type,
          v.residence_post_direction,
          v.residence_apt_unit_number,
          v.residence_city,
          v.residence_zipcode
        ORDER BY street_address
      `;
    }

    if (!geoJsonQueryString) {
        console.error("Error: Could not determine query string for map GeoJSON data.");
        return NextResponse.json({ error: "Failed to build GeoJSON query" }, { status: 500 });
    }
    
    // --- Build In-View Stats Query String (using the *same* final WHERE clause) ---
    const statsQueryString = `
      SELECT 
        AVG(v.participation_score) as average_score,
        COUNT(v.voter_registration_number) as voter_count 
      FROM ${SCHEMA_NAME}.${VOTER_TABLE} v 
      ${finalVoterWhereClause} AND v.participation_score IS NOT NULL;
    `;

    console.log(`--- Executing Map Queries (Zoom: ${zoom}, Level: ${aggregationLevel}) ---`);

    // --- Execute Queries in Parallel --- 
    const [geoJsonRowsResult, statsResult] = await Promise.all([
        sql.unsafe<MapDataRow[]>(geoJsonQueryString),
        sql.unsafe<{ average_score: number | null; voter_count: number | string }[]>(statsQueryString)
    ]);
    
    const geoJsonRows = geoJsonRowsResult;
    const stats = statsResult[0] || { average_score: null, voter_count: 0 }; // Default if no stats rows

    // --- Format GeoJSON FeatureCollection ---
    const features = geoJsonRows.map(row => {
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

    // --- Format In-View Stats ---
    const inViewStats = {
      score: stats.average_score !== null ? Math.round(stats.average_score * 10) / 10 : null,
      voterCount: typeof stats.voter_count === 'string' ? parseInt(stats.voter_count, 10) : (stats.voter_count || 0)
    };

    console.log(`Map data fetch complete. Level: ${aggregationLevel}, Features: ${features.length}, In-View Score: ${inViewStats.score}, In-View Count: ${inViewStats.voterCount}`);
    
    // --- Return Combined Response --- 
    return NextResponse.json({
      geoJson: featureCollection,
      inViewStats: inViewStats
    });

  } catch (error) {
      console.error("Error in map data API route:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 