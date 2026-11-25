import { FY_START, teamOf, ownerName } from "./rosters";
import { redis, getJson, setJson, pushEvents, isBaselined, setBaselined, claimNewDeals, releaseDeals } from "./redis";

const SMART_ZERO_PIPELINE = "903420451";
// Stages we count toward the $250K goal — everything before onboarding/live/lost.
const SMART_ZERO_FUNNEL_STAGES = {
  "1366832480": "Enquiry",
  "1366832482": "Deliberation/Trial",
  "1366832485": "Closed Won",
};
const SMART_ZERO_STAGE_ORDER = ["1366832480", "1366832482", "1366832485"];
const SMART_ZERO_WON_STAGES = new Set(["1366832485"]);
export const SMART_ZERO_GOAL = 250000;
export const GP_GOAL_PERCENT = 20;

async function hubspotSearch(body) {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HUBSPOT_TOKEN is not set");
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
  return res.json();
}

// Fetch closed-won deals since FY start for the two main teams,
// now including gp_margin so we can compute FYTD GP.
export async function fetchClosedWonDeals() {
  const deals = [];
  let after;
  do {
    const data = await hubspotSearch({
      filterGroups: [{
        filters: [
          { propertyName: "hs_is_closed_won", operator: "EQ", value: "true" },
          { propertyName: "closedate", operator: "GTE", value: `${FY_START}T00:00:00Z` },
        ],
      }],
      properties: ["dealname", "amount", "closedate", "hubspot_owner_id", "gp_margin"],
      sorts: [{ propertyName: "closedate", direction: "DESCENDING" }],
      limit: 100,
      after,
    });
    for (const r of data.results || []) {
      const gp = r.properties.gp_margin;
      deals.push({
        id: String(r.id),
        dealname: r.properties.dealname || "Unnamed deal",
        amount: Number(r.properties.amount) || 0,
        closedate: (r.properties.closedate || "").slice(0, 10),
        ownerId: String(r.properties.hubspot_owner_id || ""),
        gpMargin: gp === "" || gp === null || gp === undefined ? null : Number(gp),
      });
    }
    after = data.paging?.next?.after;
  } while (after);
  return deals.filter((d) => teamOf(d.ownerId));
}

// Deals sitting in the FORECAST stage of the Sales Pipeline, for the
// Forecast Deals screen. Sorted by expected close date, soonest first.
const SALES_PIPELINE = "2341846";
const FORECAST_STAGE = "627227";
export async function fetchForecastDeals() {
  const deals = [];
  let after;
  do {
    const data = await hubspotSearch({
      filterGroups: [{
        filters: [
          { propertyName: "pipeline", operator: "EQ", value: SALES_PIPELINE },
          { propertyName: "dealstage", operator: "EQ", value: FORECAST_STAGE },
        ],
      }],
      properties: ["dealname", "amount", "closedate", "hubspot_owner_id"],
      sorts: [{ propertyName: "closedate", direction: "ASCENDING" }],
      limit: 100,
      after,
    });
    for (const r of data.results || []) {
      const ownerId = String(r.properties.hubspot_owner_id || "");
      deals.push({
        id: String(r.id),
        dealname: r.properties.dealname || "Unnamed deal",
        amount: Number(r.properties.amount) || 0,
        closedate: (r.properties.closedate || "").slice(0, 10),
        owner: teamOf(ownerId) ? ownerName(ownerId) : "Unassigned",
      });
    }
    after = data.paging?.next?.after;
  } while (after);
  return deals;
}

// Fetch every open + won deal in the Smart Zero pipeline.
// Stage filter (below) keeps only stages before onboarding/live/lost.
export async function fetchSmartZeroDeals() {
  const deals = [];
  let after;
  do {
    const data = await hubspotSearch({
      filterGroups: [{
        filters: [
          { propertyName: "pipeline", operator: "EQ", value: SMART_ZERO_PIPELINE },
        ],
      }],
      properties: ["dealname", "amount", "dealstage", "closedate", "hs_is_closed_won"],
      limit: 100,
      after,
    });
    for (const r of data.results || []) {
      const stage = String(r.properties.dealstage || "");
      if (!SMART_ZERO_FUNNEL_STAGES[stage]) continue;
      deals.push({
        id: String(r.id),
        dealname: r.properties.dealname || "Unnamed deal",
        amount: Number(r.properties.amount) || 0,
        stageId: stage,
        stageName: SMART_ZERO_FUNNEL_STAGES[stage],
        isWon: SMART_ZERO_WON_STAGES.has(stage),
      });
    }
    after = data.paging?.next?.after;
  } while (after);
  return deals;
}

export function buildSmartZeroFunnel(deals) {
  const stages = SMART_ZERO_STAGE_ORDER.map((id) => ({
    id, name: SMART_ZERO_FUNNEL_STAGES[id], count: 0, dollars: 0,
  }));
  const byId = Object.fromEntries(stages.map((s) => [s.id, s]));
  let sold = 0;
  for (const d of deals) {
    const s = byId[d.stageId];
    if (!s) continue;
    s.count += 1;
    s.dollars += d.amount;
    if (d.isWon) sold += d.amount;
  }
  return { stages, sold, goal: SMART_ZERO_GOAL };
}

// Weighted FYTD GP%: sum(deal amount * gp%) / sum(deal amount)
// across every closed-won deal from either team that has a GP value.
export function buildGp(deals) {
  let dollars = 0, weightedGp = 0, dealsCounted = 0;
  for (const d of deals) {
    if (d.gpMargin == null || !d.amount) continue;
    dollars += d.amount;
    // HubSpot stores GP margin as a decimal (0.22 for 22%), so multiply by 100 for display.
    weightedGp += d.amount * d.gpMargin;
    dealsCounted += 1;
  }
  const avgPercent = dollars > 0 ? weightedGp / dollars : 0;
  return { avgPercent, goalPercent: GP_GOAL_PERCENT, dealsCounted, totalDollars: dollars };
}

// Sync: pull team deals from HubSpot, store, and turn newly-seen deals into events.
// Also pulls the Smart Zero pipeline (no celebration — just for the funnel screen).
// The very first sync baselines silently (no confetti storm of old deals).
export async function syncDeals() {
  const [fresh, smartZero, forecast] = await Promise.all([
    fetchClosedWonDeals(),
    fetchSmartZeroDeals().catch(() => []),
    fetchForecastDeals().catch((e) => { console.error("forecast fetch failed:", e.message); return null; }),
  ]);
  // Only overwrite the forecast list when the fetch worked, so a HubSpot
  // hiccup doesn't blank the screen.
  if (forecast) await redis.set("wb:forecast", forecast);
  const known = new Set(((await getJson("deals", [])) || []).map((d) => d.id));

  if (!(await isBaselined())) {
    await setJson("deals", fresh);
    await setJson("smartZero", smartZero);
    await setBaselined();
    return { deals: fresh.length, smartZero: smartZero.length, newEvents: 0 };
  }
  // Celebrate FIRST, then save the deal list. Previously the list was saved
  // first, so if queuing the celebration failed (e.g. a database hiccup)
  // the win was treated as already seen and its celebration was lost.
  const candidates = fresh.filter((d) => !known.has(d.id));
  const claimed = new Set(await claimNewDeals(candidates.map((d) => d.id)));
  const events = candidates
    .filter((d) => claimed.has(d.id))
    .map((d) => ({
      kind: "deal", dealId: d.id, dealname: d.dealname, amount: d.amount,
      owner: ownerName(d.ownerId), team: teamOf(d.ownerId),
    }));
  try {
    await pushEvents(events);
  } catch (e) {
    await releaseDeals([...claimed]).catch(() => {});
    throw e;
  }
  await setJson("deals", fresh);
  await setJson("smartZero", smartZero);
  return { deals: fresh.length, smartZero: smartZero.length, newEvents: events.length };
}
