import axios, { AxiosError } from "axios";

export function getApiBaseUrl(): string {
  return "/api/backend";
}

export class SafeApiError extends Error {
  constructor(message = "Something went wrong. Please try again.") {
    super(message);
    this.name = "SafeApiError";
  }
}

const api = axios.create({ baseURL: getApiBaseUrl(), timeout: 15_000, withCredentials: true });
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean });
    if (error.response?.status === 401 && original && !original._retried && !original.url?.includes("/auth/refresh")) {
      original._retried = true;
      refreshPromise ??= api.post("/auth/refresh").then(() => undefined).finally(() => { refreshPromise = null; });
      try {
        await refreshPromise;
        return api.request(original);
      } catch {
        if (typeof window !== "undefined") window.location.assign("/login");
      }
    }
    const message = error.response?.status === 401
      ? "Your session has expired. Please sign in again."
      : error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Unable to complete the request. Please try again.";
    return Promise.reject(new SafeApiError(message));
  },
);

export const register = (email: string, password: string, full_name = "") => api.post("/auth/register", { email, password, full_name });
export const login = (email: string, password: string) => api.post("/auth/login", { email, password });
export const logout = () => api.post("/auth/logout");
export const getMe = () => api.get("/auth/me");
export const updateMe = (full_name: string) => api.patch("/auth/me", { full_name });
export const changePassword = (current_password: string, new_password: string) => api.post("/auth/change-password", { current_password, new_password });
export const requestPasswordReset = (email: string) => api.post("/auth/password-reset/request", { email });
export const getKeys = () => api.get("/keys/list");
export const addKey = (data: { name: string; provider: string; key_value: string }) => api.post("/keys/add", data);
export const deleteKey = (id: string) => api.delete(`/keys/delete/${id}`);
export const getAlerts = () => api.get("/alerts/list");
export const createAlert = (data: { alert_type: string; threshold: number }) => api.post("/alerts/create", data);
export const deleteAlert = (id: string) => api.delete(`/alerts/delete/${id}`);
export const getUsageSummary = () => api.get("/usage/stats");
export const getUsageDaily = () => api.get("/usage/history");
export const resendVerification = (email: string) => api.post("/auth/verify-email/resend", { email });
export const getOrganizations = () => api.get("/organizations");
export const getOnboarding = (org: string) => api.get(`/onboarding/${org}`);
export const updateOnboarding = (org: string, data: Record<string, unknown>) => api.put(`/onboarding/${org}`, data);
export const sendTestEvent = (org: string, data: { sdk_key: string; provider: string; model: string }) => api.post(`/onboarding/${org}/test-event`, data);
export const createSdkKey = (org: string, data: Record<string, unknown>) => api.post(`/sdk-keys/${org}`, data);
export const listSdkKeys = (org: string) => api.get(`/sdk-keys/${org}`);
export const rotateSdkKey = (org: string, id: string) => api.post(`/sdk-keys/${org}/${id}/rotate`);
export const revokeSdkKey = (org: string, id: string) => api.delete(`/sdk-keys/${org}/${id}`);
export const getUsageAggregate = (params?: Record<string, string>) => api.get("/usage/aggregate", { params });
export const getUsageEvents = (params?: Record<string, string | number>) => api.get("/usage/events", { params });
export const getBudgets = (org: string) => api.get(`/budgets/${org}`);
export const createBudget = (org: string, data: Record<string, unknown>) => api.post(`/budgets/${org}`, data);
export const updateBudget = (org: string, id: string, data: Record<string, unknown>) => api.patch(`/budgets/${org}/${id}`, data);
export const deleteBudget = (org: string, id: string) => api.delete(`/budgets/${org}/${id}`);
export const getMembers = (org: string) => api.get(`/organizations/${org}/members`);
export const inviteMember = (org: string, data: { email: string; role: string }) => api.post(`/organizations/${org}/invites`, data);
export const updateMember = (org: string, id: string, role: string) => api.patch(`/organizations/${org}/members/${id}`, { role });
export const removeMember = (org: string, id: string) => api.delete(`/organizations/${org}/members/${id}`);
export const cancelInvite = (org: string, id: string) => api.delete(`/organizations/${org}/invites/${id}`);
export const getPlans = () => api.get("/subscriptions/plans");
export const getSubscription = (org: string) => api.get(`/subscriptions/${org}`);
export const getAuditLogs = (org: string) => api.get(`/audit-logs/${org}`);
export const getAlertHistory = () => api.get("/alerts/history");
export const getBillingPlans = () => api.get("/billing/plans");
export const getBillingSummary = (org: string) => api.get(`/billing/${org}/summary`);
export const createCheckout = (org: string, plan_code: string, billing_interval: "month"|"year" = "month", coupon_code?: string) => api.post(`/billing/${org}/checkout`, { plan_code, billing_interval, coupon_code: coupon_code||undefined });
export const createBillingPortal = (org: string) => api.post(`/billing/${org}/portal`, { return_path: "/dashboard/billing" });
export const getAdminOverview = () => api.get("/admin/overview");
export const getAdminResource = (resource: string, page = 1) => api.get(`/admin/${resource}`, { params: { page } });
export const getPublicStatus = () => api.get("/status");
export const createSupportTicket = (data: {category:string;subject:string;message:string;page_url?:string}) => api.post("/support/contact", data);
export const resumeSubscription = (org: string) => api.post(`/billing/${org}/resume`);
export const getOperationalMetrics = () => api.get("/internal/metrics");
export default api;
