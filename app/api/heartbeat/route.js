import { NextResponse } from "next/server";
import { saveHeartbeat } from "../../../lib/redis";
export const dynamic = "force-dynamic";

// Each screen showing the board checks in here every couple of minutes.
// The admin page uses this to show whether the office TV is awake.
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    const id = String(b.id || "").slice(0, 40);
    if (!id) return NextResponse.json({ ok: false }, { status: 400 });
    await saveHeartbeat(id, {
      name: String(b.name || "Unnamed screen").slice(0, 40),
      visible: !!b.visible,
      sound: String(b.sound || "off").slice(0, 20),
      awake: !!b.awake,
      version: String(b.version || "").slice(0, 12),
      lastShown: String(b.lastShown || "").slice(0, 120),
      lastShownAt: Number(b.lastShownAt) || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
