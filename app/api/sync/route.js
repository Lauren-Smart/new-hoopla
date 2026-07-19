import { NextResponse } from "next/server";
import { syncDeals } from "../../../lib/hubspot";
import { refreshPeopleIfStale } from "../../../lib/employmenthero";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Safety-net sync: the TV calls this every couple of minutes. Deals are
// caught even if a webhook was missed; the Employment Hero people cache
// refreshes at most once a day.
export async function GET() {
  try {
    const result = await syncDeals();
    await refreshPeopleIfStale();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
