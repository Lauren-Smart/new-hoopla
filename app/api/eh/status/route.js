import { NextResponse } from "next/server";
import { isAdmin } from "../../../../lib/auth";
import { redis } from "../../../../lib/redis";
import { refreshPeopleIfStale, getCelebrants } from "../../../../lib/employmenthero";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Admin-only diagnostic: forces a fresh Employment Hero pull and reports
// what came back. Visit /api/eh/status while signed in at /admin.
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Sign in at /admin first" }, { status: 401 });
  await redis.set("wb:peopleAt", 0); // bypass the daily staleness guard
  let refreshError = null;
  try { await refreshPeopleIfStale(); } catch (e) { refreshError = String(e.message || e); }
  const people = (await redis.get("wb:people")) || [];
  const withDob = people.filter(p => p.bMonth).length;
  const withStart = people.filter(p => p.startDate).length;
  const c = await getCelebrants();
  return NextResponse.json({
    ok: true,
    peopleLoaded: people.length,
    withBirthdayData: withDob,
    withStartDate: withStart,
    birthdaysThisMonth: c.birthdays.length,
    anniversariesThisMonth: c.anniversaries.length,
    refreshError,
  });
}
