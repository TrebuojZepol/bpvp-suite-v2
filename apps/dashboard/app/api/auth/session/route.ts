import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ACCESS } from "@/lib/engine";
import { engineFetch } from "@/app/api/_proxy";

export async function GET() {
  const jar = await cookies();
  const access = jar.get(COOKIE_ACCESS)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const upstream = await engineFetch("/auth/me", {
    headers: { Authorization: `Bearer ${access}` },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = (await upstream.json()) as { sub?: string; role?: string; mfa?: boolean };
  return NextResponse.json({
    sub: data.sub ?? "",
    role: data.role ?? "viewer",
    mfa: Boolean(data.mfa),
  });
}
