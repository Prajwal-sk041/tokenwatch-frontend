import axios, { AxiosError } from "axios";

const DEFAULT_LOCAL_API_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTPS outside local development");
    }
    return url.toString().replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production");
  }
  return DEFAULT_LOCAL_API_URL;
}

export class SafeApiError extends Error {
  constructor(message = "Something went wrong. Please try again.") {
    super(message);
    this.name = "SafeApiError";
  }
}

const api = axios.create({ baseURL: getApiBaseUrl(), timeout: 15_000 });

api.interceptors.request.use((config) => {
  const token = typeof window === "undefined" ? null : localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.assign("/login");
    }
    const message = error.response?.status === 401
      ? "Your session has expired. Please sign in again."
      : error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Unable to complete the request. Please try again.";
    return Promise.reject(new SafeApiError(message));
  },
);

export const register = (email: string, password: string) => api.post("/auth/register", { email, password });
export const login = (email: string, password: string) => api.post("/auth/login", { email, password });
export const getMe = () => api.get("/auth/me");
export const getKeys = () => api.get("/keys/list");
export const addKey = (data: { name: string; provider: string; key_value: string }) => api.post("/keys/add", data);
export const deleteKey = (id: string) => api.delete(`/keys/delete/${id}`);
export const getAlerts = () => api.get("/alerts/list");
export const createAlert = (data: { alert_type: string; threshold: number }) => api.post("/alerts/create", data);
export const deleteAlert = (id: string) => api.delete(`/alerts/delete/${id}`);
export const getUsageSummary = () => api.get("/usage/stats");
export const getUsageDaily = () => api.get("/usage/history");
export default api;
