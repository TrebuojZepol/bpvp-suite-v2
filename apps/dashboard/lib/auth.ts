/**
 * Client-side auth helpers (no secrets). Session lives in httpOnly cookies via API routes.
 */

export const AUTH_COOKIE_HINT = "bpvp_session";

export type SessionPayload = {
  sub: string;
  role: string;
  mfa: boolean;
};

export function roleBadgeVariant(role: string): "default" | "primary" | "accent" | "danger" {
  const r = role.toLowerCase();
  if (r === "admin") return "danger";
  if (r === "risk") return "accent";
  if (r === "trader" || r === "operator") return "primary";
  return "default";
}
