import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/engine";
import { engineFetch } from "@/app/api/_proxy";

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(COOKIE_REFRESH)?.value;
  if (!refresh) {
    return NextResponse.json({ error: "no refresh" }, { status: 401 });
  }

  const upstream = await engineFetch("/auth/refresh", {
    method: "POST",
    json: { refresh_token: refresh },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "refresh failed" }, { status: 401 });
  }

  const data = (await upstream.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || !data.refresh_token) {
    return NextResponse.json({ error: "invalid upstream" }, { status: 502 });
  }

  const accessMax = Math.max(60, data.expires_in ?? 8 * 3600);
  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_ACCESS, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: accessMax,
    secure: process.env.NODE_ENV === "production",
  });
  res.cookies.set(COOKIE_REFRESH, data.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
