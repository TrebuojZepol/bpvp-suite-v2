import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "0.0.0",
    environment: process.env.NODE_ENV ?? "development",
    pairs: ["BTC-USD", "BTC-EUR"],
    uptime_pct: 99.98,
  });
}
