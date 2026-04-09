import { useEffect, useState } from "react";
import type { CacheStore } from "./cache";

type QueryOptions = {
  ttlMs?: number;
  storage?: "memory" | "local";
  revalidateOnMount?: boolean;
};

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useCachedQuery<T>(
  cache: CacheStore,
  key: string,
  fetcher: () => Promise<T>,
  options: QueryOptions = {}
): QueryState<T> & { refetch: () => Promise<void> } {
  const { ttlMs = 1000 * 60 * 3, storage = "memory", revalidateOnMount = true } = options;

  const existing = cache.getCachedValue<T>(key, storage)?.value ?? null;
  const [data, setData] = useState<T | null>(existing);
  const [loading, setLoading] = useState(!existing);
  const [error, setError] = useState<string | null>(null);

  async function load(force = false) {
    setError(null);

    if (!force) {
      const cached = cache.getCachedValue<T>(key, storage)?.value ?? null;
      if (cached) {
        setData(cached);
        setLoading(false);
        if (!revalidateOnMount) {
          return;
        }
      }
    }

    setLoading(true);
    try {
      const value = force
        ? await fetcher().then((result) => {
            cache.setCachedValue(key, result, {
              ttlMs,
              storage,
            });
            return result;
          })
        : await cache.fetchWithCache(key, fetcher, {
            ttlMs,
            storage,
          });
      setData(value);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch: () => load(true),
  };
}
