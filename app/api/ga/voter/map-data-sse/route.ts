import { NextRequest, NextResponse } from 'next/server';
// import { Pool } from 'pg'; // Removed pg.Pool
import { sql } from '@/lib/voter/db'; // Use the shared db sql utility
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';

// Removed direct Pool initialization

// --- Helper function to send SSE messages ---
function sendSseMessage(controller: ReadableStreamDefaultController<any>, eventName: string, data: any) {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
}

function sendSseData(controller: ReadableStreamDefaultController<any>, data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
}

function sendSseEnd(controller: ReadableStreamDefaultController<any>) {
    const message = `event: end\ndata: done\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
    controller.close();
}

// Define an interface for the expected row structure from feature queries
interface FeatureQueryRow {
    geometry: string; // GeoJSON string for the geometry
    label: string | null;
    id?: string | null; // Optional, as addresses might not have it
    count: number | string; // Count can be string from DB, parse to number
    aggregationLevel: 'county' | 'zip' | 'address';
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const zoom = parseInt(searchParams.get('zoom') || '0', 10);
    const bboxString = searchParams.get('bbox');

    if (!bboxString) {
        return new Response('Missing bbox parameter', { status: 400 });
    }
    const bbox = bboxString.split(',').map(parseFloat);
    if (bbox.length !== 4 || bbox.some(isNaN)) {
        return new Response('Invalid bbox parameter', { status: 400 });
    }
    const [xmin, ymin, xmax, ymax] = bbox;
    const bboxGeoJsonStr = JSON.stringify({
        type: "Polygon",
        coordinates: [[ [xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin] ]]
    });

    const BATCH_SIZE = 200; // Number of features to send in each SSE data message

    const stream = new ReadableStream({
        async start(controller) {
            console.log(`SSE: Connection started. Zoom: ${zoom}, Bbox: ${bboxString}`);
            
            try {
                // --- 3. Build Base Filter Query Conditions (Sidebar Filters) ---
                const rawFilterClause = buildVoterListWhereClause(searchParams, 'vrl'); // Returns a string
                // baseFilterParams will be empty if buildVoterListWhereClause doesn't produce $n placeholders for these filters
                const baseFilterParams: any[] = []; 

                // --- 4. Fetch inViewStats (Average Score and Total Voter Count) ---
                // Removed statsQuery and related logic
                // Removed sendSseMessage(controller, 'stats', inViewStats);
                // console.log("SSE: Sent stats event", inViewStats);

                let featureQueryText: string;
                let featureQueryParams: any[] = [...baseFilterParams]; 
                let currentParamIndex = baseFilterParams.length + 1; // Starts at 1 if baseFilterParams is empty
                // Correctly integrate baseFilterWhereClause, ensuring it acts as AND conditions if it's not empty
                const featureFilterConditions = rawFilterClause.replace(/^\s*WHERE\s*/i, '').trim();
                const whereForFeatures = featureFilterConditions ? `WHERE ${featureFilterConditions} AND` : 'WHERE'; // Note the AND if conditions exist

                if (zoom < 6) { // County Aggregation
                    console.log("SSE: Aggregation Level - County");
                    featureQueryText = `
                        WITH FilteredVoters AS (
                            SELECT vrl.county_fips, vrl.county_name
                            FROM ga_voter_registration_list vrl
                            ${whereForFeatures} ST_Intersects(vrl.geom, ST_GeomFromGeoJSON($${currentParamIndex++}))
                        ),
                        AggregatedCounties AS (
                            SELECT fv.county_fips, fv.county_name, COUNT(*) as voter_count
                            FROM FilteredVoters fv GROUP BY fv.county_fips, fv.county_name
                        )
                        SELECT ac.county_name AS label, ac.county_fips AS id, ac.voter_count AS count,
                               'county' AS "aggregationLevel", ST_AsGeoJSON(c.geom) AS geometry 
                        FROM AggregatedCounties ac
                        JOIN tl_2024_us_county c ON ac.county_fips = c.geoid WHERE c.geom IS NOT NULL;
                    `;
                } else if (zoom >= 6 && zoom < 11) { // Zip/ZCTA Aggregation
                    console.log("SSE: Aggregation Level - ZCTA");
                    featureQueryText = `
                        WITH FilteredVoters AS (
                            SELECT vrl.zcta FROM ga_voter_registration_list vrl
                            ${whereForFeatures} ST_Intersects(vrl.geom, ST_GeomFromGeoJSON($${currentParamIndex++}))
                        ),
                        AggregatedZCTAs AS (
                            SELECT fv.zcta, COUNT(*) as voter_count FROM FilteredVoters fv GROUP BY fv.zcta
                        )
                        SELECT az.zcta AS label, az.zcta AS id, az.voter_count AS count,
                               'zip' AS "aggregationLevel", ST_AsGeoJSON(z.geom) AS geometry 
                        FROM AggregatedZCTAs az
                        JOIN tl_2024_us_zcta520 z ON az.zcta = z."ZCTA5CE20" WHERE z.geom IS NOT NULL;
                    `;
                } else { // Individual Addresses (Points)
                    console.log("SSE: Aggregation Level - Address");
                    featureQueryText = `
                        WITH FilteredAddresses AS (
                            SELECT 
                                vrl.geom, 
                                COUNT(DISTINCT vrl.voter_registration_number) AS voter_count_at_address,
                                -- Corrected address construction based on original map-data route
                                CONCAT_WS(' ', 
                                    NULLIF(vrl.residence_street_number, ''), 
                                    NULLIF(vrl.residence_pre_direction, ''), 
                                    NULLIF(vrl.residence_street_name, ''), 
                                    NULLIF(vrl.residence_street_type, ''), 
                                    NULLIF(vrl.residence_post_direction, ''),
                                    CASE WHEN vrl.residence_apt_unit_number IS NOT NULL AND vrl.residence_apt_unit_number != '' 
                                        THEN CONCAT('# ', vrl.residence_apt_unit_number) 
                                        ELSE NULL END
                                ) as street_address_part,
                                vrl.residence_city, 
                                vrl.residence_zipcode 
                            FROM ga_voter_registration_list vrl
                            ${whereForFeatures} ST_Intersects(vrl.geom, ST_GeomFromGeoJSON($${currentParamIndex++}))
                            GROUP BY 
                                vrl.geom, 
                                vrl.residence_street_number, 
                                vrl.residence_pre_direction, 
                                vrl.residence_street_name, 
                                vrl.residence_street_type, 
                                vrl.residence_post_direction, 
                                vrl.residence_apt_unit_number, 
                                vrl.residence_city, 
                                vrl.residence_zipcode
                        )
                        SELECT 
                            -- Construct the final label similar to the original route
                            CONCAT(fa.street_address_part, ', ', fa.residence_city, ', GA ', fa.residence_zipcode) AS label, 
                            CONCAT(fa.street_address_part, ', ', fa.residence_city, ', GA ', fa.residence_zipcode) AS id, -- Use label as ID
                            fa.voter_count_at_address AS count,
                            'address' AS "aggregationLevel", 
                            ST_AsGeoJSON(fa.geom) AS geometry
                        FROM FilteredAddresses fa 
                        WHERE fa.geom IS NOT NULL;
                    `;
                }
                featureQueryParams.push(bboxGeoJsonStr);

                // --- Attempt to Stream Features using a cursor-like method from the 'sql' utility ---
                console.log("SSE: Attempting to stream features with cursor-like approach...");
                const queryResultForCursor = sql.unsafe(featureQueryText, featureQueryParams);

                // Check if the result object has a .cursor method (common in postgres.js)
                if (typeof queryResultForCursor.cursor === 'function') {
                    console.log("SSE: .cursor() method found. Streaming features.");
                    let featuresSent = 0;
                    let batchIndex = 0; // Add batch index logging
                    for await (const rows of queryResultForCursor.cursor(BATCH_SIZE)) {
                        console.log(`SSE Cursor: Fetched ${rows.length} rows for batch ${batchIndex}.`);
                        let featuresBatch;
                        try {
                            featuresBatch = rows.map(row => ({ // Removed explicit : FeatureQueryRow type
                                type: 'Feature' as const,
                                // Add safety check for geometry parsing
                                geometry: row.geometry ? JSON.parse(row.geometry) : null,
                                properties: {
                                    label: row.label,
                                    id: row.id,
                                    count: parseInt(String(row.count), 10) || 0,
                                    aggregationLevel: row.aggregationLevel,
                                }
                            })).filter(f => f.geometry !== null); // Filter out features with parse errors

                            console.log(`SSE Cursor: Processed batch ${batchIndex} into ${featuresBatch.length} valid features.`);
                        } catch (mapError: any) {
                             console.error(`SSE Cursor: Error processing batch ${batchIndex}:`, mapError);
                             // Decide if you want to skip this batch or error out
                             // Sending an error and stopping might be safest
                             sendSseMessage(controller, 'error', { message: `Error processing batch ${batchIndex}: ${mapError.message}` });
                             controller.error(mapError); 
                             return; // Stop processing
                        }

                        if (featuresBatch.length > 0) {
                            console.log(`SSE Cursor: Sending batch ${batchIndex} with ${featuresBatch.length} features...`);
                            sendSseData(controller, { type: 'FeatureCollection', features: featuresBatch });
                            featuresSent += featuresBatch.length;
                            console.log(`SSE Cursor: Sent batch ${batchIndex}. Total sent: ${featuresSent}`);
                        }
                        batchIndex++;
                    }
                    if (featuresSent === 0) {
                        console.log("SSE: No features found or streamed via cursor.");
                    }
                } else {
                    // Fallback: If .cursor() is not available, load all and batch from memory (previous approach)
                    console.warn("SSE: .cursor() method not found on sql.unsafe result. Falling back to in-memory batching.");
                    const allFeaturesResult = await queryResultForCursor; // Assuming it resolves to the array of rows
                    if (allFeaturesResult && allFeaturesResult.length > 0) {
                        console.log(`SSE Fallback: Processing ${allFeaturesResult.length} total features.`);
                        for (let i = 0; i < allFeaturesResult.length; i += BATCH_SIZE) {
                            const batchIndex = i / BATCH_SIZE;
                            const batch = allFeaturesResult.slice(i, i + BATCH_SIZE);
                            console.log(`SSE Fallback: Sliced batch ${batchIndex} with ${batch.length} features.`);
                            let featuresBatch;
                             try {
                                featuresBatch = batch.map(row => ({
                                    type: 'Feature' as const,
                                     // Add safety check for geometry parsing
                                    geometry: row.geometry ? JSON.parse(row.geometry) : null,
                                    properties: {
                                        label: row.label,
                                        id: row.id,
                                        count: parseInt(String(row.count), 10) || 0,
                                        aggregationLevel: row.aggregationLevel,
                                    }
                                })).filter(f => f.geometry !== null); // Filter out features with parse errors
                                console.log(`SSE Fallback: Processed batch ${batchIndex} into ${featuresBatch.length} valid features.`);
                            } catch (mapError: any) {
                                console.error(`SSE Fallback: Error processing batch ${batchIndex}:`, mapError);
                                sendSseMessage(controller, 'error', { message: `Error processing fallback batch ${batchIndex}: ${mapError.message}` });
                                controller.error(mapError); 
                                return; // Stop processing
                            }

                            if (featuresBatch.length > 0) {
                                console.log(`SSE Fallback: Sending batch ${batchIndex} with ${featuresBatch.length} features...`);
                                sendSseData(controller, { type: 'FeatureCollection', features: featuresBatch });
                                console.log(`SSE Fallback: Sent batch ${batchIndex}.`);
                            }
                        }
                    } else {
                        console.log("SSE: No features found for the current view/filters (fallback in-memory).");
                    }
                }
                
                // Send end event (no need to check signal.aborted here, 
                // as inner errors return early)
                sendSseEnd(controller);
                console.log("SSE: Sent end event and closed stream.");

            } catch (error: any) {
                console.error('SSE Stream Error in start():', error);
                 // Attempt to send error message and close stream, 
                 // swallowing secondary errors if the stream is already closed.
                 try {
                    sendSseMessage(controller, 'error', { message: error.message || 'An error occurred on the server.' });
                    controller.error(error); 
                 } catch (e) { 
                    console.error("SSE: Error sending error message/closing controller (stream likely already closed):", e);
                 }
            } finally {
                console.log("SSE: Stream processing finished in start()'s finally block.");
            }
        },
        cancel(reason) {
            console.log('SSE Stream Cancelled by client:', reason);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}

// Basic health check or non-SSE endpoint for testing the route setup
export async function POST(request: NextRequest) {
    return NextResponse.json({ message: "This is the map-data-sse POST endpoint. Use GET for SSE." });
} 