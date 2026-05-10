import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { engineFetch } from "@/app/api/_proxy";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ status: "wallet_challenge_ready" });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username : "wallet";

  const upstream = await engineFetch("/auth/challenge", {
    method: "POST",
    json: { username },
  });

  if (upstream.ok) {
    return NextResponse.json(await upstream.json());
  }

  const nonce = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 5 * 60_000).toISOString();
  return NextResponse.json({
    nonce,
    expires_at: expires,
    note: "Local fallback — engine challenge unavailable.",
  });
}
