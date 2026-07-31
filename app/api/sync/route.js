import { NextResponse } from "next/server";
import { checkMailbox } from "../../../lib/mailwatch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called by the TV every couple of minutes, alongside the HubSpot sync.
// Also safe to hit manually while debugging — returns a small JSON summary.
export async function GET() {
  try {
    const result = await checkMailbox();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
