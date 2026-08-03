import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getJson, getEventsSince, getLatestEventId, redis } from "../../../lib/redis";
import { getCelebrants } from "../../../lib/employmenthero";
import { buildSmartZeroFunnel, buildGp } from "../../../lib/hubspot";

export const dynamic = "force-dynamic";

// The TV polls this every few seconds. ?since=<eventId> returns any newer
// celebration events; since of -1 means "first load, just baseline me".
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get("since") ?? -1);

  const [deals, deliveries, announcements, smartZeroDeals, latestEventId, celebrants, marketing] = await Promise.all([
    getJson("deals", []),
    getJson("deliveries", []),
    getJson("announcements", []),
    getJson("smartZero", []),
    getLatestEventId(),
    getCelebrants(),
    redis.get("wb:marketing"),
  ]);

  let photos = [];
  try {
    const blobs = await list({ prefix: "photos/" });
    photos = blobs.blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((b) => ({ url: b.url, pathname: b.pathname }));
  } catch { photos = []; }

  const events = since >= 0 ? await getEventsSince(since) : [];
  const smartZero = buildSmartZeroFunnel(smartZeroDeals);
  const gp = buildGp(deals);

  return NextResponse.json({
    deals, deliveries, announcements, photos, events, latestEventId,
    birthdays: celebrants.birthdays, anniversaries: celebrants.anniversaries,
    smartZero, gp, marketing: marketing || null,
  });
}
