export type Role = "admin" | "trader" | "risk" | "operator" | "viewer";

export function normalizeRole(role: string | undefined | null): Role {
  const r = (role ?? "viewer").toLowerCase().trim();
  if (r === "admin" || r === "trader" || r === "risk" || r === "operator" || r === "viewer") {
    return r;
  }
  return "viewer";
}

export function canAccess(sessionRoles: string[], allowed: Role[]): boolean {
  if (allowed.length === 0) return true;
  const set = new Set(allowed.map((a) => a.toLowerCase()));
  return sessionRoles.some((sr) => set.has(normalizeRole(sr)));
}

export function stepUpRequired(action: string): boolean {
  const a = action.toLowerCase().trim();
  return ["withdraw", "pause-trading", "rotate-keys", "policy-change", "user-delete"].includes(a);
}
