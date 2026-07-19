import { NextResponse } from "next/server";
import { completeAuth, refreshPeopleIfStale } from "../../../../lib/employmenthero";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ ok: false, error: "Missing code" }, { status: 400 });
  try {
    await completeAuth(code);
    await refreshPeopleIfStale();
    return NextResponse.redirect(new URL("/admin?eh=connected", request.url));
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
