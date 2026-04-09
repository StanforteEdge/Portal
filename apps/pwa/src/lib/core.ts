import {
  createAuthApi,
  createCacheStore,
  createHttpClient,
  useCachedQuery as useSharedCachedQuery,
} from "@stanforte/shared";
import { API_BASE_URL, CACHE_PREFIX } from "@/lib/env";

export const httpRequest = createHttpClient({
  apiBaseUrl: API_BASE_URL,
});

export const authApi = createAuthApi(httpRequest);
export const cacheStore = createCacheStore(CACHE_PREFIX);

export const useCachedQuery = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttlMs?: number;
    storage?: "memory" | "local";
    revalidateOnMount?: boolean;
  }
) => useSharedCachedQuery(cacheStore, key, fetcher, options);
