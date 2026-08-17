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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// HubSpot's CRM Search endpoints carry a tight per-second burst limit,
// separate from (and stricter than) the account's general API limit. The
// marketing snapshot fires several search calls close together (form
// submissions x2, sold, pipeline's first page), and pipeline alone can page
// through 25+ requests for a portal this size — enough to occasionally trip
// a 429 "secondly limit" even though the account is nowhere near its daily
// quota. Retry with backoff (honouring Retry-After when HubSpot sends one)
// instead of failing the whole snapshot over a transient burst.
async function hsPost(path, body, attempt = 0) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HUBSPOT_TOKEN missing");
  const res = await fetch(`${HS_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 4) {
    const retryAfterSec = Number(res.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
      ? retryAfterSec * 1000
      : 400 * 2 ** attempt + Math.random() * 200;
    await sleep(backoffMs);
    return hsPost(path, body, attempt + 1);
  }
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
// hs_analytics_source (HubSpot's automatic session-tracking property) only
// works for deals created through a tracked web session. Most Sales Pipeline
// deals here are created manually by reps (via the CRM UI, email, the sales
// extension, imports, etc.), so hs_analytics_source comes back "Offline" for
// nearly all of them and badly undercounts marketing-sourced pipeline. Used
// only for the "sold" figure below, which was already confirmed working.
const MARKETING_SOURCES = new Set([
  "ORGANIC_SEARCH", "PAID_SEARCH", "EMAIL_MARKETING",
  "SOCIAL_MEDIA", "PAID_SOCIAL", "REFERRALS",
]);
// deal_origin is a rep-filled-in field on the deal itself (not session
// tracking), so it actually captures how these deals came in. Confirmed with
// Lauren which of its values count as "marketing": Website Enquiry,
// Partnerships, Networking Events — not Tender Search, Consultant, Customer
// Referral, Existing Customer, etc.
const MARKETING_DEAL_ORIGINS = ["Website Enquiry", "Partnerships", "Networking Events"];
// HubSpot pipeline ID for the "Sales Pipeline" — deals the sales team is
// actively working. "$ in Marketing Pipeline" means marketing-sourced deals
// sitting HERE, not in HubSpot's separate "Marketing Pipeline"/"Marketing
// Leads" pipelines (those are pre-sales nurture stages, mostly $0 deals) —
// confirmed with Lauren after the first version summed every open,
// marketing-sourced deal across all 7 pipelines and came out to $30.6M.
const SALES_PIPELINE_ID = "2341846";

// Sums `amount` across every matching deal. `filterMatch`, if given, is an
// extra client-side check per record (used for the hs_analytics_source
// case, which HubSpot can't reliably filter server-side the way we need);
// omit it when the server-side `filters` already fully scope the query.
async function sumMarketingDeals(filters, filterMatch) {
  let after, total = 0;
  do {
    const data = await hsPost("/crm/v3/objects/deals/search", {
      filterGroups: [{ filters }],
      properties: ["amount", "hs_analytics_source", "deal_origin"],
      limit: 100,
      after,
    });
    for (const r of data.results || []) {
      if (!filterMatch || filterMatch(r.properties)) {
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
    const total = await sumMarketingDeals(
      [
        { propertyName: "hs_is_closed_won", operator: "EQ", value: "true" },
        { propertyName: "closedate", operator: "GTE", value: fromMs },
      ],
      (props) => MARKETING_SOURCES.has(props.hs_analytics_source)
    );
    return { sold: total, goal: MARKETING_GOAL };
  } catch (e) {
    console.error("fetchMarketingSold:", e.message);
    return { sold: 0, goal: MARKETING_GOAL };
  }
}

async function fetchMarketingPipeline() {
  try {
    // Current open pipeline — a snapshot, not date-windowed like sold.
    // deal_origin filtering happens server-side (HubSpot's IN operator
    // correctly matches this multi-select field even when a deal has more
    // than one origin, e.g. "Self Generated;Networking Events").
    return await sumMarketingDeals([
      { propertyName: "hs_is_closed", operator: "NEQ", value: "true" },
      { propertyName: "pipeline", operator: "EQ", value: SALES_PIPELINE_ID },
      { propertyName: "deal_origin", operator: "IN", values: MARKETING_DEAL_ORIGINS },
    ]);
  } catch (e) { console.error("fetchMarketingPipeline:", e.message); return null; }
}

// ── Orchestrator ────────────────────────────────────────────
export async function fetchMarketingSnapshot() {
  const now = windowLast30();
  const prev = windowPrev30();

  // Stagger the kick-off of each search slightly rather than firing all
  // four at once — pipeline alone pages through 25+ requests for a portal
  // this size, and starting everything in the same instant is what was
  // tripping HubSpot's per-second burst limit on the search endpoint.
  const staggered = (fn, delayMs) => sleep(delayMs).then(fn);
  const [formsNow, formsPrev, sold, pipeline] = await Promise.all([
    staggered(() => countFormSubmissions(now.fromMs, now.toMs), 0),
    staggered(() => countFormSubmissions(prev.fromMs, prev.toMs), 150),
    staggered(() => fetchMarketingSold(), 300),
    staggered(() => fetchMarketingPipeline(), 450),
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
