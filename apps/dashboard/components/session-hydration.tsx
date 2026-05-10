"use client";

import { useSession } from "@/hooks/useSession";

export function SessionHydration() {
  useSession();
  return null;
}
