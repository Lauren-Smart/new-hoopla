import { NextResponse } from "next/server";

// TEMPORARY diagnostic route — safe to hit directly in a browser, makes no
// writes, doesn't touch the live board or Redis. Only exists to answer one
// question: can the site's actual private-app token (not just an
// interactively-authenticated HubSpot connection) reach content-analytics
// data for "Total Visitors"? Delete this file once that's answered.
//
// HubSpot's content analytics report (rawViews per page) is confirmed to
// return real portal-wide traffic data through an authenticated HubSpot
// session, but the underlying REST endpoint isn't documented as
// private-app-token-compatible anywhere we could find — so rather than
// guess and wire it into the real dashboard (which has broken production
// twice before from unverified endpoints), this tries a few candidates and
// reports exactly what each one returns.

const HS_BASE = "https://api.hubapi.com";

async function tryEndpoint(label, path, body) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) return { label, error: "HUBSPOT_TOKEN missing" };
  try {
    const res = await fetch(`${HS_BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text.slice(0, 800); }
    return { label, status: res.status, ok: res.ok, body: parsed };
  } catch (e) {
    return { label, error: e.message };
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const results = await Promise.all([
    tryEndpoint("v1-site-page", "/content-analytics/v1/reports/totals", {
      start, end, contentType: "SITE_PAGE", metrics: ["RAW_VIEWS"], limit: 5,
    }),
    tryEndpoint("v1-landing-page", "/content-analytics/v1/reports/totals", {
      start, end, contentType: "LANDING_PAGE", metrics: ["RAW_VIEWS"], limit: 5,
    }),
    tryEndpoint("v1-blog-post", "/content-analytics/v1/reports/totals", {
      start, end, contentType: "BLOG_POST", metrics: ["RAW_VIEWS"], limit: 5,
    }),
  ]);

  return NextResponse.json({ start, end, results });
}
