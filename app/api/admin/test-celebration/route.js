import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { pushEvents } from "../../../../lib/redis";
export const dynamic = "force-dynamic";

// Sends a practice celebration to every screen, so anyone can check the
// office TV is working without waiting for a real win.
export async function POST() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  await pushEvents([{
    kind: "deal", test: true, dealname: "This is a test celebration",
    amount: 0, owner: "the Wins Board", team: "sales",
  }]);
  return NextResponse.json({ ok: true });
}
