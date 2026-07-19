import { NextResponse } from "next/server";
import { grantAdmin } from "../../../../lib/auth";

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  grantAdmin();
  return NextResponse.json({ ok: true });
}
