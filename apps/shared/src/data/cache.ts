type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
  updatedAt: number;
};

type CacheOptions = {
  ttlMs: number;
  storage?: "memory" | "local";
};

export type CacheStore = {
  invalidateCache: (key: string) => void;
  getCachedValue: <T>(key: string, storage?: CacheOptions["storage"]) => CacheEnvelope<T> | null;
  setCachedValue: <T>(key: string, value: T, options: CacheOptions) => void;
  fetchWithCache: <T>(key: string, fetcher: () => Promise<T>, options: CacheOptions) => Promise<T>;
};

export function createCacheStore(prefix = "app_cache:"): CacheStore {
  const memoryCache = new Map<string, CacheEnvelope<unknown>>();
  const inFlightRequests = new Map<string, Promise<unknown>>();

  function canUseStorage() {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  }

  function readLocal<T>(key: string): CacheEnvelope<T> | null {
    if (!canUseStorage()) return null;

    const raw = window.localStorage.getItem(`${prefix}${key}`);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as CacheEnvelope<T>;
      if (!parsed || typeof parsed.expiresAt !== "number") {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  function writeLocal<T>(key: string, payload: CacheEnvelope<T>) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(`${prefix}${key}`, JSON.stringify(payload));
  }

  function deleteLocal(key: string) {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(`${prefix}${key}`);
  }

  function invalidateCache(key: string) {
    memoryCache.delete(key);
    deleteLocal(key);
  }

  function getCachedValue<T>(
    key: string,
    storage: CacheOptions["storage"] = "memory"
  ): CacheEnvelope<T> | null {
    const payload =
      storage === "local"
        ? readLocal<T>(key)
        : (memoryCache.get(key) as CacheEnvelope<T> | undefined) ?? null;

    if (!payload) return null;
    if (Date.now() > payload.expiresAt) {
      invalidateCache(key);
      return null;
    }

    return payload;
  }

  function setCachedValue<T>(key: string, value: T, options: CacheOptions) {
    const payload: CacheEnvelope<T> = {
      value,
      updatedAt: Date.now(),
      expiresAt: Date.now() + options.ttlMs,
    };

    if (options.storage === "local") {
      writeLocal(key, payload);
      return;
    }

    memoryCache.set(key, payload as CacheEnvelope<unknown>);
  }

  async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    const cached = getCachedValue<T>(key, options.storage);
    if (cached) {
      return cached.value;
    }

    const requestKey = `${options.storage ?? "memory"}:${key}`;
    const existingRequest = inFlightRequests.get(requestKey) as Promise<T> | undefined;
    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      const value = await fetcher();
      setCachedValue(key, value, options);
      return value;
    })();

    inFlightRequests.set(requestKey, request as Promise<unknown>);
    try {
      return await request;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  }

  return {
    invalidateCache,
    getCachedValue,
    setCachedValue,
    fetchWithCache,
  };
}
