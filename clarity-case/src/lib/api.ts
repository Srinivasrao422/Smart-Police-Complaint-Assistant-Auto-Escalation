import axios from "axios";
import { getStoredToken, logoutUser } from "@/lib/session";

const BASE = import.meta.env.VITE_API_URL as string; // ✅ FIXED

let isHandlingUnauthorized = false;

export const apiClient = axios.create({
  baseURL: BASE,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 &&
      typeof window !== "undefined" &&
      getStoredToken() &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;
      logoutUser("/auth");
      window.setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 0);
    }
    return Promise.reject(error);
  }
);

const unwrap = async <T>(promise: Promise<{ data: T }>) => {
  try {
    const res = await promise;
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};

export const api = {
  get: <T = any>(path: string) => unwrap(apiClient.get<T>(path)),
  post: <T = any>(path: string, data: any) => unwrap(apiClient.post<T>(path, data)),
  put: <T = any>(path: string, data: any) => unwrap(apiClient.put<T>(path, data)),
  patch: <T = any>(path: string, data: any) => unwrap(apiClient.patch<T>(path, data)),
  del: <T = any>(path: string) => unwrap(apiClient.delete<T>(path)),
};

export default api;
