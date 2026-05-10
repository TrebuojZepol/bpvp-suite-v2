"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api, isRateLimitError } from "@/lib/api";
import { normalizeRole } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";

export type LoginInput = {
  username: string;
  password: string;
  totp?: string;
};

export function useAuth() {
  const router = useRouter();
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  const login = useMutation({
    mutationFn: async (input: LoginInput) => {
      await api.post("/api/auth/login", input);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["session"] });
      try {
        const { data } = await api.get<{ sub: string; role: string; mfa: boolean }>("/api/auth/session");
        setSession({
          sub: data.sub,
          role: normalizeRole(data.role),
          mfa: data.mfa,
        });
      } catch {
        setSession(null);
      }
      router.push("/dashboard");
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.post("/api/auth/logout");
    },
    onSuccess: async () => {
      setSession(null);
      await qc.invalidateQueries({ queryKey: ["session"] });
      router.push("/");
    },
  });

  return {
    login,
    logout,
    rateLimitRetryAfter: isRateLimitError(login.error) ? login.error.retryAfterSec : undefined,
  };
}
