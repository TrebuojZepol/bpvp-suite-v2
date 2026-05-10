import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ACCESS } from "@/lib/engine";
import { engineFetch } from "@/app/api/_proxy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const jar = await cookies();
  const access = jar.get(COOKIE_ACCESS)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const upstream = await engineFetch("/auth/totp/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
    json: body,
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "verify failed" }, { status: upstream.status });
  }

  return NextResponse.json(await upstream.json().catch(() => ({ ok: true })));
}
