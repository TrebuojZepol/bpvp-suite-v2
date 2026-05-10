"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SessionPayload } from "@/lib/auth";
import { normalizeRole } from "@/lib/rbac";
import { useAuthStore } from "@/lib/store";

async function fetchSession(): Promise<SessionPayload | null> {
  try {
    const { data } = await api.get<SessionPayload>("/api/auth/session");
    return data;
  } catch {
    return null;
  }
}

export function useSession() {
  const setSession = useAuthStore((s) => s.setSession);

  const q = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (q.data) {
      setSession({ sub: q.data.sub, role: normalizeRole(q.data.role), mfa: q.data.mfa });
    } else if (q.isFetched && !q.isFetching) {
      setSession(null);
    }
  }, [q.data, q.isFetched, q.isFetching, setSession]);

  return q;
}
