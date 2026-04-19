import axios from "axios";

const rawBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const apiBase = rawBase
  ? rawBase.endsWith("/api")
    ? rawBase
    : `${rawBase}/api`
  : "/api";

const apiClient = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

export { apiClient };
