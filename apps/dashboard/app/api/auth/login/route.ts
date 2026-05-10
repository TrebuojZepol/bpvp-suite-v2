import { NextResponse } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/engine";
import { engineFetch } from "@/app/api/_proxy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const upstream = await engineFetch("/auth/login", {
    method: "POST",
    json: {
      username: body.username,
      password: body.password,
      totp: body.totp,
    },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: "upstream", detail: text.slice(0, 200) },
      { status: upstream.status === 401 ? 401 : 502 },
    );
  }

  const data = (await upstream.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || !data.refresh_token) {
    return NextResponse.json({ error: "invalid upstream response" }, { status: 502 });
  }

  const accessMax = Math.max(60, data.expires_in ?? 8 * 3600);
  const res = NextResponse.json({ ok: true, expires_in: accessMax });

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
