import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/rbac";

export type AuthState = {
  sub: string | null;
  role: Role | null;
  mfa: boolean;
  setSession: (s: { sub: string; role: Role; mfa: boolean } | null) => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  sub: null,
  role: null,
  mfa: false,
  setSession: (s) =>
    set(
      s
        ? { sub: s.sub, role: s.role, mfa: s.mfa }
        : { sub: null, role: null, mfa: false },
    ),
}));

export type UIState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    { name: "bpvp-dashboard-ui" },
  ),
);
