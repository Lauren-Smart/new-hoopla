import { NextResponse } from "next/server";
import { fetchMarketingSnapshot } from "../../../lib/hubspotMarketing";
import { redis } from "../../../lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// The TV calls this alongside the regular /api/sync. Cached in Redis so a
// slow marketing pull doesn't hold up deal celebrations elsewhere.
// Safe to hit manually while debugging — returns the full snapshot.
export async function GET() {
  try {
    const snapshot = await fetchMarketingSnapshot();
    await redis.set("wb:marketing", snapshot);
    return NextResponse.json({ ok: true, snapshot });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
