import { NextResponse } from "next/server";
import { syncDeals } from "../../../../lib/hubspot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Point a HubSpot workflow "Send a webhook" action here:
//   https://YOUR-APP.vercel.app/api/webhooks/hubspot?secret=WEBHOOK_SECRET
// Trigger: deal stage becomes Closed Won. We don't trust the payload blindly —
// we re-sync from the HubSpot API, which both verifies and captures the deal.
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await syncDeals();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
