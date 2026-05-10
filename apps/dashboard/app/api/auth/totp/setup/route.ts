import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_ACCESS } from "@/lib/engine";
import { engineFetch } from "@/app/api/_proxy";

export async function GET(req: Request) {
  const jar = await cookies();
  const access = jar.get(COOKIE_ACCESS)?.value;
  if (!access) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const username = url.searchParams.get("username") ?? "";

  const upstream = await engineFetch(`/auth/totp/setup?username=${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${access}` },
  });

  if (upstream.ok) {
    return new NextResponse(await upstream.text(), {
      status: 200,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  }

  return NextResponse.json(
    {
      provisioning_uri: `otpauth://totp/BPVP:${username || "user"}?secret=PLACEHOLDER&issuer=BPVP`,
      note: "Engine TOTP setup not available — placeholder URI for UI wiring.",
    },
    { status: 200 },
  );
}
