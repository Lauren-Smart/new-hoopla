import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { beginAuth } from "../../../../lib/employmenthero";

export const dynamic = "force-dynamic";

// Admin-only: kicks off the one-time Employment Hero authorisation.
// Sign in at /admin first, then visit /api/eh/connect.
export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ ok: false, error: "Sign in at /admin first" }, { status: 401 });
  }
  return NextResponse.redirect(await beginAuth());
}
