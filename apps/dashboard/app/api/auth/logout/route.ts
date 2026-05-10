import { NextResponse } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/engine";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ACCESS, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(COOKIE_REFRESH, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
