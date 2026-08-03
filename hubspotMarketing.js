// Marketing data pulls for the wins board (2 screens).
// All windows are Sydney-local last-30-days vs previous-30-days.
// Each fetcher wraps its own try/catch and returns null on failure so
// the TV never breaks — worst case a tile just shows an em-dash.

const HS_BASE = "https://api.hubapi.com";

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
function ymd(d) { return d.toISOString().slice(0, 10); }

function windowLast30() {
  const to = new Date();
  const from = daysAgo(30);
  return { from: ymd(from), to: ymd(to), fromMs: from.getTime(), toMs: to.getTime() };
}
function windowPrev30() {
  const to = daysAgo(30);
  const from = daysAgo(60);
  return { from: ymd(from), to: ymd(to), fromMs: from.getTime(), toMs: to.getTime() };
}
function pctChange(now, prev) {
  if (prev == null) return null;
  if (prev === 0) return now > 0 ? 100 : 0;
  return ((now - prev) / prev) * 100;
}

async function hsGet(path, params = {}) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HUBSPOT_TOKEN missing");
  const url = new URL(`${HS_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GET ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
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

// ── Contacts and customers created in window (CRM search) ───
async function countContacts(fromMs, toMs) {
  try {
    const data = await hsPost("/crm/v3/objects/contacts/search", {
      filterGroups: [{
        filters: [
          { propertyName: "createdate", operator: "GTE", value: fromMs },
          { propertyName: "createdate", operator: "LT", value: toMs },
        ],
      }],
      limit: 1,
      properties: ["createdate"],
    });
    return Number(data.total) || 0;
  } catch (e) { console.error("countContacts:", e.message); return null; }
}

async function countCustomers(fromMs, toMs) {
  try {
    const data = await hsPost("/crm/v3/objects/contacts/search", {
      filterGroups: [{
        filters: [
          { propertyName: "lifecyclestage", operator: "EQ", value: "customer" },
          { propertyName: "hs_lifecyclestage_customer_date", operator: "GTE", value: fromMs },
          { propertyName: "hs_lifecyclestage_customer_date", operator: "LT", value: toMs },
        ],
      }],
      limit: 1,
      properties: ["hs_lifecyclestage_customer_date"],
    });
    return Number(data.total) || 0;
  } catch (e) { console.error("countCustomers:", e.message); return null; }
}

// ── Sessions (analytics reports API) ────────────────────────
async function fetchSessions(from, to) {
  try {
    // /analytics/v2 uses YYYYMMDD date format (no dashes)
    const data = await hsGet("/analytics/v2/reports/sessions/total", {
      start: from.replace(/-/g, ""),
      end: to.replace(/-/g, ""),
    });
    // Response shapes vary — try a couple of known ones
    if (typeof data.total === "number") return data.total;
    if (typeof data.visits === "number") return data.visits;
    if (Array.isArray(data)) {
      return data.reduce((s, r) => s + (Number(r.visits) || 0), 0);
    }
    if (typeof data === "object") {
      let total = 0;
      for (const v of Object.values(data)) {
        if (Array.isArray(v)) v.forEach((r) => { total += Number(r?.visits) || 0; });
      }
      return total;
    }
    return null;
  } catch (e) { console.error("fetchSessions:", e.message); return null; }
}

// ── Blog views (content analytics — TOTALS on blog posts) ───
async function fetchBlogViews(from, to) {
  try {
    const data = await hsPost("/content-analytics/v1/reports/totals", {
      start: from, end: to,
      contentType: "BLOG_POST",
      metrics: ["RAW_VIEWS"],
      limit: 500,
    });
    let total = 0;
    (data.results || data.data || []).forEach((r) => {
      total += Number(r.metrics?.RAW_VIEWS ?? r.rawViews ?? r.RAW_VIEWS) || 0;
    });
    return total;
  } catch (e) { console.error("fetchBlogViews:", e.message); return null; }
}

// ── Landing page metrics (views + submissions) ─────────────
async function fetchLandingPages(from, to) {
  try {
    const data = await hsPost("/content-analytics/v1/reports/totals", {
      start: from, end: to,
      contentType: "LANDING_PAGE",
      metrics: ["RAW_VIEWS", "SUBMISSIONS"],
      limit: 500,
    });
    let views = 0, subs = 0;
    (data.results || data.data || []).forEach((r) => {
      views += Number(r.metrics?.RAW_VIEWS ?? r.rawViews ?? r.RAW_VIEWS) || 0;
      subs += Number(r.metrics?.SUBMISSIONS ?? r.submissions ?? r.SUBMISSIONS) || 0;
    });
    return { views, submissions: subs, conversionRate: views > 0 ? (subs / views) * 100 : 0 };
  } catch (e) { console.error("fetchLandingPages:", e.message); return null; }
}

// ── Social interactions (across networks in window) ────────
async function fetchSocial(from, to) {
  try {
    // The reports/v2/social API returns interactions summed per network
    const data = await hsGet("/broadcast/v1/broadcast-messages/summary", {
      startDate: from, endDate: to,
    });
    if (typeof data.total === "number") return data.total;
    if (typeof data.interactions === "number") return data.interactions;
    if (Array.isArray(data)) {
      return data.reduce((s, r) => s + (Number(r.interactions) || 0), 0);
    }
    return null;
  } catch (e) { console.error("fetchSocial:", e.message); return null; }
}

// ── Marketing-attributed pipeline (FY27, closed-won marketing sources) ──
const FY27_START = "2026-07-01";
const MARKETING_GOAL = 7_000_000;
const MARKETING_SOURCES = new Set([
  "ORGANIC_SEARCH", "PAID_SEARCH", "EMAIL_MARKETING",
  "SOCIAL_MEDIA", "PAID_SOCIAL", "REFERRALS",
]);
async function fetchMarketingLeads() {
  try {
    const fromMs = new Date(`${FY27_START}T00:00:00Z`).getTime();
    let after, total = 0;
    do {
      const data = await hsPost("/crm/v3/objects/deals/search", {
        filterGroups: [{
          filters: [
            { propertyName: "hs_is_closed_won", operator: "EQ", value: "true" },
            { propertyName: "closedate", operator: "GTE", value: fromMs },
          ],
        }],
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
    return { sold: total, goal: MARKETING_GOAL };
  } catch (e) {
    console.error("fetchMarketingLeads:", e.message);
    return { sold: 0, goal: MARKETING_GOAL };
  }
}

// ── Orchestrator ────────────────────────────────────────────
export async function fetchMarketingSnapshot() {
  const now = windowLast30();
  const prev = windowPrev30();

  const [
    sessNow, sessPrev,
    conNow, conPrev,
    custNow, custPrev,
    socNow, socPrev,
    blogNow, blogPrev,
    lpNow, lpPrev,
    leads,
  ] = await Promise.all([
    fetchSessions(now.from, now.to),
    fetchSessions(prev.from, prev.to),
    countContacts(now.fromMs, now.toMs),
    countContacts(prev.fromMs, prev.toMs),
    countCustomers(now.fromMs, now.toMs),
    countCustomers(prev.fromMs, prev.toMs),
    fetchSocial(now.from, now.to),
    fetchSocial(prev.from, prev.to),
    fetchBlogViews(now.from, now.to),
    fetchBlogViews(prev.from, prev.to),
    fetchLandingPages(now.from, now.to),
    fetchLandingPages(prev.from, prev.to),
    fetchMarketingLeads(),
  ]);

  const convRateNow = (conNow > 0 && custNow != null) ? (custNow / conNow) * 100 : null;
  const convRatePrev = (conPrev > 0 && custPrev != null) ? (custPrev / conPrev) * 100 : null;

  return {
    sessions: { value: sessNow, change: sessNow != null && sessPrev != null ? pctChange(sessNow, sessPrev) : null },
    newContacts: { value: conNow, change: conNow != null && conPrev != null ? pctChange(conNow, conPrev) : null },
    customers: { value: custNow, change: custNow != null && custPrev != null ? pctChange(custNow, custPrev) : null },
    socialInteractions: { value: socNow, change: socNow != null && socPrev != null ? pctChange(socNow, socPrev) : null },
    conversionRate: {
      value: convRateNow,
      change: convRateNow != null && convRatePrev != null ? convRateNow - convRatePrev : null,
      isPercentPoints: true,
    },
    blogViews: { value: blogNow, change: blogNow != null && blogPrev != null ? pctChange(blogNow, blogPrev) : null },

    leads,
    landingPages: {
      views: lpNow?.views ?? 0,
      submissions: lpNow?.submissions ?? 0,
      conversionRate: lpNow?.conversionRate ?? 0,
      viewsChange: (lpNow && lpPrev) ? pctChange(lpNow.views, lpPrev.views) : null,
      submissionsChange: (lpNow && lpPrev) ? pctChange(lpNow.submissions, lpPrev.submissions) : null,
      conversionChange: (lpNow && lpPrev && lpPrev.conversionRate > 0)
        ? (lpNow.conversionRate - lpPrev.conversionRate) : null,
    },

    updatedAt: new Date().toISOString(),
  };
}
