import axios from "axios";
import { AxiosHeaders } from "axios";
import { clearSession } from "./authStorage";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3000/v1" : "/v1");

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
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
        const refreshResponse = await axios.post(
          `${apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true }
        );

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
