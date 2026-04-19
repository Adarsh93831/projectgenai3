import { create } from "zustand";

import { apiClient } from "../api/axios.js";

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  login: async (payload) => {
    const response = await apiClient.post("/auth/login", payload);
    set({ user: response.data?.data || null });
    return response.data?.data;
  },

  register: async (payload) => {
    const response = await apiClient.post("/auth/register", payload);
    set({ user: response.data?.data || null });
    return response.data?.data;
  },

  checkAuth: async () => {
    set({ loading: true });

    try {
      const response = await apiClient.get("/auth/me");
      set({ user: response.data?.data || null, loading: false });
      return response.data?.data;
    } catch {
      set({ user: null, loading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      set({ user: null });
    }
  },
}));

export { useAuthStore };
