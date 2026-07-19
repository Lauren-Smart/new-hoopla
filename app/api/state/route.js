import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { getJson, getEventsSince, getLatestEventId } from "../../../lib/redis";
import { getCelebrants } from "../../../lib/employmenthero";

export const dynamic = "force-dynamic";

// The TV polls this every few seconds. ?since=<eventId> returns any newer
// celebration events; since of -1 means "first load, just baseline me".
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const since = Number(searchParams.get("since") ?? -1);

  const [deals, deliveries, announcements, latestEventId, celebrants] = await Promise.all([
    getJson("deals", []),
    getJson("deliveries", []),
    getJson("announcements", []),
    getLatestEventId(),
    getCelebrants(),
  ]);

  let photos = [];
  try {
    const blobs = await list({ prefix: "photos/" });
    photos = blobs.blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((b) => ({ url: b.url, pathname: b.pathname }));
  } catch {
    photos = []; // Blob store not configured yet — photos screen just won't show
  }

  const events = since >= 0 ? await getEventsSince(since) : [];

  return NextResponse.json({
    deals, deliveries, announcements, photos, events, latestEventId,
    birthdays: celebrants.birthdays, anniversaries: celebrants.anniversaries,
  });
}
