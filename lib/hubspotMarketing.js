// Marketing data pulls for the wins board (2 screens).
// All windows are Sydney-local last-30-days vs previous-30-days unless noted.
// Each fetcher wraps its own try/catch and returns null on failure so
// the TV never breaks — worst case a tile just shows an em-dash.
//
// IMPORTANT: only build fetchers against HubSpot's current CRM Search API
// (/crm/v3/objects/*/search). Earlier versions of this file called several
// endpoints — /analytics/v2/reports (sessions), /broadcast/v1 (social),
// /content-analytics/v1 (blog/landing views) — that HubSpot has deprecated
// or that aren't reachable from a private-app token, which is why those
// tiles went blank. Total visitors, organic-search visitors, and LinkedIn
// followers aren't obtainable through HubSpot's API at all right now (no
// portal-wide traffic-by-source endpoint exists, and followers isn't a
// HubSpot concept) — those stay null on purpose until we have another data
// source (e.g. Google Search Console for organic search, LinkedIn's API for
// followers) to wire in.

const HS_BASE = "https://api.hubapi.com";

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function windowLast30() {
  const to = new Date();
  const from = daysAgo(30);
  return { fromMs: from.getTime(), toMs: to.getTime() };
}
function windowPrev30() {
  const to = daysAgo(30);
  const from = daysAgo(60);
  return { fromMs: from.getTime(), toMs: to.getTime() };
}
function pctChange(now, prev) {
  if (prev == null) return null;
  if (prev === 0) return now > 0 ? 100 : 0;
  return ((now - prev) / prev) * 100;
}

async function hsPost(path, body) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HUBSPOT_TOKEN missing");
  const res = await fetch(`${HS_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// ── Form submissions (contacts whose most recent form submission falls
// in the window). Counts contacts, not raw submission events, so a
// contact who submitted twice in the window is only counted once —
// close enough for a wins-board tile, and built on a real, stable
// contact property (recent_conversion_date) rather than a guessed one. ──
async function countFormSubmissions(fromMs, toMs) {
  try {
    const data = await hsPost("/crm/v3/objects/contacts/search", {
      filterGroups: [{
        filters: [
          { propertyName: "recent_conversion_date", operator: "GTE", value: fromMs },
          { propertyName: "recent_conversion_date", operator: "LT", value: toMs },
        ],
      }],
      limit: 1,
      properties: ["recent_conversion_date"],
    });
    return Number(data.total) || 0;
  } catch (e) { console.error("countFormSubmissions:", e.message); return null; }
}

// ── Marketing-sourced deals: sold (closed-won, FYTD) and open pipeline ──
const FY27_START = "2026-07-01";
const MARKETING_GOAL = 7_000_000;
const MARKETING_SOURCES = new Set([
  "ORGANIC_SEARCH", "PAID_SEARCH", "EMAIL_MARKETING",
  "SOCIAL_MEDIA", "PAID_SOCIAL", "REFERRALS",
]);

async function sumMarketingDeals(filters) {
  let after, total = 0;
  do {
    const data = await hsPost("/crm/v3/objects/deals/search", {
      filterGroups: [{ filters }],
      properties: ["amount", "hs_analytics_source"],
      limit: 100,
      after,
    });
    for (const r of data.results || []) {
      if (MARKETING_SOURCES.has(r.properties.hs_analytics_source)) {
        total += Number(r.properties.amount) || 0;
      }
    }
    after = data.paging?.next?.after;
  } while (after);
  return total;
}

async function fetchMarketingSold() {
  try {
    const fromMs = new Date(`${FY27_START}T00:00:00Z`).getTime();
    const total = await sumMarketingDeals([
      { propertyName: "hs_is_closed_won", operator: "EQ", value: "true" },
      { propertyName: "closedate", operator: "GTE", value: fromMs },
    ]);
    return { sold: total, goal: MARKETING_GOAL };
  } catch (e) {
    console.error("fetchMarketingSold:", e.message);
    return { sold: 0, goal: MARKETING_GOAL };
  }
}

async function fetchMarketingPipeline() {
  try {
    // Current open pipeline — a snapshot, not date-windowed like sold.
    return await sumMarketingDeals([
      { propertyName: "hs_is_closed", operator: "NEQ", value: "true" },
    ]);
  } catch (e) { console.error("fetchMarketingPipeline:", e.message); return null; }
}

// ── Orchestrator ────────────────────────────────────────────
export async function fetchMarketingSnapshot() {
  const now = windowLast30();
  const prev = windowPrev30();

  const [formsNow, formsPrev, sold, pipeline] = await Promise.all([
    countFormSubmissions(now.fromMs, now.toMs),
    countFormSubmissions(prev.fromMs, prev.toMs),
    fetchMarketingSold(),
    fetchMarketingPipeline(),
  ]);

  return {
    // Not available via HubSpot's API today — see file header. Shown as
    // "Coming soon" on the board until we have a source for these.
    totalVisitors: { value: null, change: null },
    organicSearchVisitors: { value: null, change: null },
    linkedinFollowers: { value: null, change: null },

    formSubmissions: {
      value: formsNow,
      change: formsNow != null && formsPrev != null ? pctChange(formsNow, formsPrev) : null,
    },
    pipeline,
    leads: sold,

    updatedAt: new Date().toISOString(),
  };
}
