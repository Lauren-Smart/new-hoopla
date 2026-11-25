import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { getScreens } from "../../../../lib/redis";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const screens = (await getScreens()).sort((a, b) => (b.seen || 0) - (a.seen || 0));
  return NextResponse.json({
    ok: true,
    screens,
    version: (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 12),
  });
}
