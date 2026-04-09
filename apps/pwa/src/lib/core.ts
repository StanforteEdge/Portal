import {
  createAuthApi,
  createCacheStore,
  createHttpClient,
  createSessionStorage,
  useCachedQuery as useSharedCachedQuery,
} from "@stanforte/shared";
import { API_BASE_URL, CACHE_PREFIX } from "@/lib/env";

export const sessionStorage = createSessionStorage("se");
export const httpRequest = createHttpClient({
  apiBaseUrl: API_BASE_URL,
  session: sessionStorage,
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
