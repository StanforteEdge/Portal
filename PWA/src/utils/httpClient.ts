import axios from "axios";
import { getStoredSession, updateSessionTokens, clearSession } from "./authStorage";

const apiClient = axios.create({
  baseURL: "/wp-json/api/v1",
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getStoredSession();

  if (accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
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

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
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
          "/wp-json/api/v1/auth/refresh",
          {
            refresh_token: session.refreshToken,
          }
        );

        const {
          data: {
            data: { tokens },
          },
        } = refreshResponse;

        updateSessionTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in
        );

        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
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
