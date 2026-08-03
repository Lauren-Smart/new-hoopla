import { NextResponse } from "next/server";
import { syncDeals } from "../../../lib/hubspot";
import { refreshPeopleIfStale } from "../../../lib/employmenthero";
import { fetchMarketingSnapshot } from "../../../lib/hubspotMarketing";
import { redis } from "../../../lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Safety-net sync: the TV calls this every couple of minutes. Deals are
// caught even if a webhook was missed; Employment Hero refreshes at most
// once a day; marketing snapshot refreshes on every cycle. Any single
// failure is logged but doesn't break the response — the TV keeps ticking.
export async function GET() {
  try {
    const result = await syncDeals();
    await refreshPeopleIfStale();
    try {
      const snap = await fetchMarketingSnapshot();
      await redis.set("wb:marketing", snap);
    } catch (e) {
      console.error("marketing sync (inside /api/sync) failed:", e.message);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
