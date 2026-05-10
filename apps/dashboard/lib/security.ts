/**
 * Security helpers for client-visible configuration.
 * CSP nonce is injected server-side via middleware (x-csp-nonce header).
 */

export const SECURITY_HEADERS_DOC = {
  cspNonceHeader: "x-csp-nonce",
} as const;

export function getCspNonceFromDocument(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const el = document.querySelector("meta[name='csp-nonce']");
  return el?.getAttribute("content") ?? undefined;
}
