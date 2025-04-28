// lib/voter/batch-cache.ts

// Simple in-memory cache for individual DB batch results
// Note: This cache is per-instance in serverless environments and will reset on cold starts.
// Consider LRU cache (e.g., 'lru-cache' npm package) for production to limit memory.
const cache = new Map<string, unknown[]>(); // Cache key: SQL string, Value: Array of results (unknown)

const DEFAULT_TTL_SECONDS = 3600; // Cache for 1 hour (TTL itself not implemented yet)

/**
 * Retrieves cached data for a specific SQL batch query.
 * @template T The expected type of objects in the cached array.
 * @param sql The exact SQL query string used as the key.
 * @returns The cached array of rows cast to type T[], or null if not found.
 */
export function getCachedBatch<T>(sql: string): T[] | null {
  if (cache.has(sql)) {
//   console.log(`CACHE HIT (Batch): ${sql.substring(0, 100)}...`);
    // Retrieve as unknown[] and then assert/cast to T[]
    // This assumes the caller knows the correct type T
    const cachedValue = cache.get(sql);
    return (cachedValue as T[] | undefined) ?? null;
  }
//   console.log(`CACHE MISS (Batch): ${sql.substring(0, 100)}...`);
  return null;
}

/**
 * Stores the results of a specific SQL batch query in the cache.
 * @template T The type of objects in the array being cached.
 * @param sql The exact SQL query string to use as the key.
 * @param value The array of rows returned by the query.
 * @param ttlSeconds Optional TTL in seconds (currently ignored).
 */
export function setCachedBatch<T>(
  sql: string,
  value: T[], // Value provided is already typed T[]
  ttlSeconds: number = DEFAULT_TTL_SECONDS
) {
//   console.log(`CACHE SET (Batch, TTL ${ttlSeconds}s not implemented): ${sql.substring(0, 100)}...`);
  // Store the typed value; it conforms to unknown[]
  cache.set(sql, value);
  // TODO: Implement actual TTL logic if needed (e.g., using setTimeout to schedule deletion)
}

/**
 * Placeholder function to invalidate a specific batch cache key.
 * @param sql The exact SQL query string (cache key) to invalidate.
 */
export function invalidateCachedBatch(sql: string) {
//   console.log(`CACHE INVALIDATE (Batch, Placeholder): ${sql.substring(0, 100)}...`);
  cache.delete(sql);
}

/**
 * Placeholder function to clear the entire batch cache.
 */
export function clearBatchCache() {
//   console.log('CACHE CLEAR (Batch, Placeholder): Clearing entire cache.');
  cache.clear();
} 