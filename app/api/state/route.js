import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { redis } from "../../../lib/redis";
import { getCelebrants } from "../../../lib/employmenthero";
import { buildSmartZeroFunnel, buildGp } from "../../../lib/hubspot";
export const dynamic = "force-dynamic";
// The TV polls this every few seconds. ?since=<eventId> returns any newer
// celebration events; since of -1 means "first load, just baseline me".
// Everything is read from the database in ONE command (MGET) to keep the
// Upstash monthly command count low.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get("since") ?? -1);
  const [deals, deliveries, announcements, smartZeroDeals, eventSeq, allEvents, marketing, people, okrs] =
    await redis.mget(
      "wb:deals",
      "wb:deliveries",
      "wb:announcements",
      "wb:smartZero",
      "wb:eventSeq",
      "wb:events",
      "wb:marketing",
      "wb:people",
      "wb:eh:okrs"
    );
  const celebrants = await getCelebrants(people || []);
  let photos = [];
  try {
    const blobs = await list({ prefix: "photos/" });
    photos = blobs.blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((b) => ({ url: b.url, pathname: b.pathname }));
  } catch { photos = []; }
  const events = since >= 0 ? (allEvents || []).filter((e) => e.id > since) : [];
  // Every celebration from the last 18 hours (covers overnight). Each screen remembers which
  // ones it has already shown, so a screen that was asleep, refreshed or
  // switched off when a win came in still plays it once it is back.
  const cutoff = Date.now() - 18 * 60 * 60 * 1000;
  const recent = (allEvents || []).filter((e) => (e.at || 0) >= cutoff);
  const smartZero = buildSmartZeroFunnel(smartZeroDeals || []);
  const gp = buildGp(deals || []);
  return NextResponse.json({
    deals: deals || [], deliveries: deliveries || [], announcements: announcements || [],
    photos, events, recent, latestEventId: Number(eventSeq) || 0,
    birthdays: celebrants.birthdays, anniversaries: celebrants.anniversaries,
    smartZero, gp, marketing: marketing || null, okrs: okrs || [],
    // Which version of the board is live. The TV compares this on every poll
    // and reloads itself when a new version has been deployed.
    version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || "dev",
  });
}
