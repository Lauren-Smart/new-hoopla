import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { getJson, setJson } from "../../../../lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, announcements: await getJson("announcements", []) });
}

export async function POST(request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const { message } = await request.json().catch(() => ({}));
  const msg = String(message || "").trim();
  if (!msg) return NextResponse.json({ ok: false, error: "Empty message" }, { status: 400 });
  const announcements = (await getJson("announcements", [])) || [];
  announcements.unshift({ message: msg, date: new Date().toISOString().slice(0, 10), id: Date.now() });
  await setJson("announcements", announcements.slice(0, 30));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await request.json().catch(() => ({}));
  const announcements = (await getJson("announcements", [])) || [];
  await setJson("announcements", announcements.filter((a) => a.id !== id));
  return NextResponse.json({ ok: true });
}
