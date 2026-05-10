export function engineBaseURL(): string {
  return (process.env.BPVP_ENGINE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
}

export const COOKIE_ACCESS = "bpvp_access";
export const COOKIE_REFRESH = "bpvp_refresh";
