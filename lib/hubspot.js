import { FY_START, teamOf, ownerName } from "./rosters";
import { getJson, setJson, pushEvents, isBaselined, setBaselined } from "./redis";

// Fetch all closed-won deals since FY start from HubSpot (paginated).
export async function fetchClosedWonDeals() {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) throw new Error("HUBSPOT_TOKEN is not set");
  const deals = [];
  let after;
  do {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        filterGroups: [{
          filters: [
            { propertyName: "hs_is_closed_won", operator: "EQ", value: "true" },
            { propertyName: "closedate", operator: "GTE", value: `${FY_START}T00:00:00Z` },
          ],
        }],
        properties: ["dealname", "amount", "closedate", "hubspot_owner_id"],
        sorts: [{ propertyName: "closedate", direction: "DESCENDING" }],
        limit: 100,
        after,
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HubSpot ${res.status}: ${await res.text()}`);
    const data = await res.json();
    for (const r of data.results || []) {
      deals.push({
        id: String(r.id),
        dealname: r.properties.dealname || "Unnamed deal",
        amount: Number(r.properties.amount) || 0,
        closedate: (r.properties.closedate || "").slice(0, 10),
        ownerId: String(r.properties.hubspot_owner_id || ""),
      });
    }
    after = data.paging?.next?.after;
  } while (after);
  return deals.filter((d) => teamOf(d.ownerId));
}

// Sync: pull from HubSpot, store, and turn newly-seen deals into events.
// The very first sync baselines silently (no confetti storm of old deals).
export async function syncDeals() {
  const fresh = await fetchClosedWonDeals();
  const known = new Set(((await getJson("deals", [])) || []).map((d) => d.id));
  await setJson("deals", fresh);

  if (!(await isBaselined())) {
    await setBaselined();
    return { deals: fresh.length, newEvents: 0 };
  }
  const events = fresh
    .filter((d) => !known.has(d.id))
    .map((d) => ({
      kind: "deal",
      dealname: d.dealname,
      amount: d.amount,
      owner: ownerName(d.ownerId),
      team: teamOf(d.ownerId),
    }));
  await pushEvents(events);
  return { deals: fresh.length, newEvents: events.length };
}
