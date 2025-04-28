import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';
import { getCachedBatch, setCachedBatch } from '@/lib/voter/batch-cache'; // Import cache functions

// --- Removed Cache Setup from here ---

// Suggest a longer execution time if needed, similar to download route
// export const maxDuration = 300;

const TOTAL_BATCH_SIZE = 50000; // The conceptual large batch size
const CONCURRENCY_LEVEL = 5;    // Number of parallel workers
const WORKER_BATCH_SIZE = Math.ceil(TOTAL_BATCH_SIZE / CONCURRENCY_LEVEL); // Batch size per worker

const MAP_DATA_TABLE = 'GA_VOTER_REGISTRATION_LIST'; // Confirm table name
const SCHEMA_NAME = process.env.PG_VOTERDATA_SCHEMA || 'public';

interface MapDataRow {
  geometry: string; // GeoJSON string from ST_AsGeoJSON
  voter_count: number;
  voter_ids: string[]; // Array of voter_registration_number
}

// Helper to send SSE events
const sendEvent = (controller: ReadableStreamDefaultController<any>, encoder: TextEncoder, eventName: string, data: object | string) => {
  if (controller.desiredSize === null) {
    // console.warn(`SSE sendEvent: Stream closed or closing, suppressing event '${eventName}'.`);
    return; 
  }
  try {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    if (controller.desiredSize === null) return;
    controller.enqueue(encoder.encode(`event: ${eventName}\n`));
    if (controller.desiredSize === null) return;
    controller.enqueue(encoder.encode(`data: ${message}\n\n`));
  } catch (e: any) {
    // Be less verbose specifically for the expected "Invalid state" error near the end
    if (e.code === 'ERR_INVALID_STATE') {
        // console.warn(`SSE sendEvent: Suppressed write to closed stream for event '${eventName}'.`);
    } else {
        console.error(`SSE sendEvent: Error during enqueue for event '${eventName}'.`, e);
    }
  }
};

// Worker function to fetch and process a slice of data
async function fetchWorkerSlice(
  workerIndex: number,
  baseQuery: string, // Query *without* LIMIT/OFFSET
  controller: ReadableStreamDefaultController<any>,
  encoder: TextEncoder
): Promise<number> {
  let currentWorkerOffsetMultiplier = 0;
  let continueFetching = true;
  let totalWorkerFetched = 0;

  while (continueFetching) {
    const dbOffset = (workerIndex * WORKER_BATCH_SIZE) + (currentWorkerOffsetMultiplier * TOTAL_BATCH_SIZE);
    const batchQuery = `${baseQuery} LIMIT ${WORKER_BATCH_SIZE} OFFSET ${dbOffset}`;
    let rows: MapDataRow[] | null = null;
    let cacheHit = false;

    // === Check Batch Cache ===
    rows = getCachedBatch(batchQuery);
    if (rows !== null) {
      cacheHit = true;
      // Console log is now inside getCachedBatch
    } else {
      // === Cache Miss - Query DB ===
    //   console.log(`Worker ${workerIndex}: CACHE MISS. Fetching DB batch: LIMIT ${WORKER_BATCH_SIZE} OFFSET ${dbOffset}`); // Keep miss log here
      try {
         rows = await sql.unsafe<MapDataRow[]>(batchQuery);
        //  console.log(`Worker ${workerIndex}: DB Batch returned ${rows.length} records.`);
         // Store successful DB result in batch cache
         setCachedBatch(batchQuery, rows); // Use default TTL
      } catch (dbError) {
         console.error(`Worker ${workerIndex}: DB Error fetching batch OFFSET ${dbOffset}:`, dbError);
         sendEvent(controller, encoder, 'error', { message: `Worker ${workerIndex} failed during DB query.` });
         throw dbError;
      }
    }
    // ==========================

    // Ensure rows is an array for processing
    if (rows === null) rows = [];

    if (rows.length > 0) {
      // If it was a cache hit, we still need to count them for total
      if (cacheHit) {
        totalWorkerFetched += rows.length;
      }
      // If it was a DB fetch, the count was added implicitly by adding to totalWorkerFetched on success
      else {
         totalWorkerFetched += rows.length;
      }

      // Process and send rows (whether from cache or DB)
      for (const row of rows) {
        try {
          const feature = {
            type: 'Feature',
            geometry: row.geometry ? JSON.parse(row.geometry) : null,
            properties: {
              voter_count: row.voter_count,
              voter_ids: row.voter_ids,
            },
          };
          if (feature.geometry) {
             sendEvent(controller, encoder, 'message', feature);
          }
        } catch (parseError) {
           console.warn(`Worker ${workerIndex}: Error parsing geometry for row from ${cacheHit ? 'cache' : 'DB'} at offset ${dbOffset}, skipping row:`, parseError, row);
        }
      }
    } else {
      continueFetching = false;
    }

    // Stop fetching for this worker if fewer rows than batch size were returned
    // Important: This check should happen *after* processing, even if rows came from cache
    if (rows.length < WORKER_BATCH_SIZE) {
      continueFetching = false;
    }

    currentWorkerOffsetMultiplier++;
  }

  console.log(`Worker ${workerIndex} finished. Processed ${totalWorkerFetched} records (from DB or cache).`);
  return totalWorkerFetched;
}

export async function GET(request: NextRequest) {
  console.log('Map data SSE request received (Parallel with Batch Cache Module)');
  const searchParams = request.nextUrl.searchParams;
  const filterConditions = buildVoterListWhereClause(searchParams);
  let whereClause = 'WHERE t.geom IS NOT NULL';
  if (filterConditions && filterConditions.trim().length > 0) {
    const conditionsOnly = filterConditions.trim().substring(5).trim();
    if (conditionsOnly.length > 0) {
      whereClause += ` AND (${conditionsOnly})`;
    }
  }
//   console.log(`Constructed WHERE clause: ${whereClause}`);

  const baseQuery = `
    SELECT
      ST_AsGeoJSON(t.geom) as geometry,
      COUNT(t.voter_registration_number) as voter_count,
      JSON_AGG(t.voter_registration_number) as voter_ids
    FROM
      ${SCHEMA_NAME}.${MAP_DATA_TABLE} t
    ${whereClause}
    GROUP BY
      t.geom
    ORDER BY
      t.geom
  `;

  let streamController: ReadableStreamDefaultController<any>;
  const stream = new ReadableStream({
    async start(controller) {
      streamController = controller;
      const encoder = new TextEncoder();

      // --- Launch Parallel Workers ---
      const workerPromises: Promise<number>[] = [];
    //   console.log(`Launching ${CONCURRENCY_LEVEL} parallel workers with batch size ${WORKER_BATCH_SIZE} (Batch Caching Enabled)...`);
      for (let i = 0; i < CONCURRENCY_LEVEL; i++) {
        workerPromises.push(
          fetchWorkerSlice(i, baseQuery, controller, encoder)
        );
      }

      // --- Wait for all workers using Promise.allSettled --- 
      let totalProcessed = 0;
      let anyWorkerFailed = false;
      try {
        // Wait for all promises to settle (either resolve or reject)
        const results = await Promise.allSettled(workerPromises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            totalProcessed += result.value;
          } else {
            // Log the rejection reason, but don't re-throw here
            console.error(`Worker ${index} failed:`, result.reason);
            anyWorkerFailed = true;
          }
        });

        if (anyWorkerFailed) {
        //    console.log(`One or more workers failed. Total records processed by successful workers: ${totalProcessed}`);
           // Send error event *after* all workers have finished attempting their work
           sendEvent(controller, encoder, 'error', { message: 'An error occurred during data fetching in one or more workers.' });
        } else {
        //    console.log(`All workers finished successfully. Total records processed (DB or Cache): ${totalProcessed}`);
           // Send end event *after* all workers have finished successfully
           sendEvent(controller, encoder, 'end', { totalRecordsProcessed: totalProcessed });
        }

      } catch (unexpectedError) {
        // This catch is less likely now with allSettled, but for safety
        console.error('Unexpected error managing workers:', unexpectedError);
        sendEvent(controller, encoder, 'error', { message: 'An unexpected error occurred managing data fetchers.' });
      } 
      // Stream should close naturally after this point
    },
    cancel(reason) {
      console.log('Map data SSE stream cancelled by client. Reason:', reason);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
} 