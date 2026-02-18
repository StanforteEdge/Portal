import axios from "axios";
import { AxiosHeaders } from "axios";
import { getStoredSession, updateSessionTokens, clearSession } from "./authStorage";
import { normalizeTokens } from "./authTokens";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000/v1" : "/v1");

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getStoredSession();

  if (accessToken) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      const headers = (config.headers || {}) as Record<string, string>;
      headers.Authorization = `Bearer ${accessToken}`;
      config.headers = headers as any;
    }
  }

  return config;
});

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function enqueueRefresh(callback: () => void) {
  refreshQueue.push(callback);
}

function flushQueue() {
  while (refreshQueue.length) {
    const callback = refreshQueue.shift();
    callback?.();
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest.__isRetryRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueueRefresh(async () => {
            try {
              const { accessToken } = getStoredSession();

              if (!accessToken) {
                reject(error);
                return;
              }

              if (originalRequest.headers instanceof AxiosHeaders) {
                originalRequest.headers.set("Authorization", `Bearer ${accessToken}`);
              } else {
                originalRequest.headers = {
                  ...(originalRequest.headers || {}),
                  Authorization: `Bearer ${accessToken}`,
                };
              }
              resolve(apiClient(originalRequest));
            } catch (retryError) {
              reject(retryError);
            }
          });
        });
      }

      originalRequest.__isRetryRequest = true;
      isRefreshing = true;

      try {
        const session = getStoredSession();

        if (!session.refreshToken) {
          clearSession();
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(
          `${apiBaseUrl}/auth/refresh`,
          {
            refresh_token: session.refreshToken,
          }
        );

        const payload = refreshResponse?.data?.data ?? {};
        const tokens = normalizeTokens(payload);

        updateSessionTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in
        );

        if (originalRequest.headers instanceof AxiosHeaders) {
          originalRequest.headers.set("Authorization", `Bearer ${tokens.access_token}`);
        } else {
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${tokens.access_token}`,
          };
        }
        flushQueue();
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
