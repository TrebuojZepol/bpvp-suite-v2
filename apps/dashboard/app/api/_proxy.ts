import { engineBaseURL } from "@/lib/engine";

export async function engineFetch(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<Response> {
  const { json, ...rest } = init ?? {};
  const url = `${engineBaseURL()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(rest.headers);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
}
