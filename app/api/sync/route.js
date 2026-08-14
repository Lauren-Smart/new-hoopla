import { redis } from "./redis";
import crypto from "crypto";
// Employment Hero OAuth 2.0 (authorization code + PKCE) and employee cache.
// One-time setup: an admin visits /api/eh/connect to authorise; tokens are
// stored in Redis and refreshed automatically after that.
const OAUTH_BASE = "https://oauth.employmenthero.com/oauth2";
const API_BASE = "https://api.employmenthero.com/api/v1";
const TOKENS_KEY = "wb:eh:tokens";
const VERIFIER_KEY = "wb:eh:verifier";
const PEOPLE_KEY = "wb:people";
const PEOPLE_AT_KEY = "wb:peopleAt";
const OKRS_KEY = "wb:eh:okrs";
const OKRS_AT_KEY = "wb:eh:okrsAt";
// People who'd rather not appear on the birthday/anniversary screens —
// add names exactly as they appear in Employment Hero.
export const EXCLUDED_NAMES = [];
// Health status → dial colour + label, used by the OKR screen.
// Employment Hero currently reports: on_track, making_progress, off_track.
export const HEALTH_META = {
  on_track: { color: "#82E196", label: "On Track" },
  making_progress: { color: "#FAB419", label: "Making Progress" },
  off_track: { color: "#B41E1E", label: "Off Track" },
};
const HEALTH_SEVERITY = { off_track: 3, making_progress: 2, on_track: 1 };
export function redirectUri() {
  return `${process.env.APP_URL || ""}/api/eh/callback`;
}
export async function beginAuth() {
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  await redis.set(VERIFIER_KEY, verifier, { ex: 600 });
  const params = new URLSearchParams({
    client_id: process.env.EH_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${OAUTH_BASE}/authorize?${params}`;
}
export async function completeAuth(code) {
  const verifier = await redis.get(VERIFIER_KEY);
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.EH_CLIENT_ID,
      client_secret: process.env.EH_CLIENT_SECRET,
      redirect_uri: redirectUri(),
      code_verifier: verifier || "",
    }),
  });
  if (!res.ok) throw new Error(`EH token exchange failed: ${await res.text()}`);
  const tokens = await res.json();
  await redis.set(TOKENS_KEY, { ...tokens, obtained_at: Date.now() });
  return true;
}
async function accessToken() {
  const tokens = await redis.get(TOKENS_KEY);
  if (!tokens) throw new Error("Employment Hero not connected — visit /api/eh/connect");
  const ageSec = (Date.now() - (tokens.obtained_at || 0)) / 1000;
  if (ageSec < (tokens.expires_in || 900) - 60) return tokens.access_token;
  // Refresh (Employment Hero rotates refresh tokens — always store the new one)
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: process.env.EH_CLIENT_ID,
      client_secret: process.env.EH_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`EH token refresh failed: ${await res.text()}`);
  const next = await res.json();
  await redis.set(TOKENS_KEY, { ...tokens, ...next, obtained_at: Date.now() });
  return next.access_token;
}
async function ehGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`EH ${res.status}: ${await res.text()}`);
  return res.json();
}
async function resolveOrgId(token) {
  let orgId = process.env.EH_ORG_ID;
  if (!orgId) {
    const orgs = await ehGet("/organisations", token);
    orgId = orgs?.data?.items?.[0]?.id;
  }
  if (!orgId) throw new Error("No Employment Hero organisation found");
  return orgId;
}
// Refresh the cached people list (name + birthday day/month + start date)
// at most once every 24 h. Year of birth is deliberately never stored.
export async function refreshPeopleIfStale() {
  const last = (await redis.get(PEOPLE_AT_KEY)) || 0;
  if (Date.now() - last < 24 * 60 * 60 * 1000) return;
  try {
    const token = await accessToken();
    const orgId = await resolveOrgId(token);
    const people = [];
    let page = 1;
    while (true) {
      const data = await ehGet(`/organisations/${orgId}/employees?page_index=${page}&item_per_page=100`, token);
      const items = data?.data?.items || [];
      for (const e of items) {
        if (e.termination_date) continue;
        const name = e.known_as ? `${e.known_as} ${e.last_name}` : `${e.first_name} ${e.last_name}`;
        if (EXCLUDED_NAMES.includes(name)) continue;
        const dob = (e.date_of_birth || "").slice(0, 10);
        const start = (e.start_date || "").slice(0, 10);
        people.push({
          name,
          bMonth: dob ? Number(dob.slice(5, 7)) : null,
          bDay: dob ? Number(dob.slice(8, 10)) : null,
          startDate: start || null,
        });
      }
      if (items.length < 100) break;
      page += 1;
    }
    await redis.set(PEOPLE_KEY, people);
    await redis.set(PEOPLE_AT_KEY, Date.now());
  } catch (e) {
    // Not connected yet or transient failure — screens simply won't show.
    console.error("Employment Hero refresh skipped:", e.message);
  }
}
// Build this-month birthday and anniversary lists (Sydney time).
export async function getCelebrants() {
  const people = (await redis.get(PEOPLE_KEY)) || [];
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Australia/Sydney" }));
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.getDate();
  const birthdays = people
    .filter((p) => p.bMonth === month && p.bDay)
    .map((p) => ({ name: p.name, day: p.bDay, month, isToday: p.bDay === today }))
    .sort((a, b) => a.day - b.day);
  const anniversaries = people
    .filter((p) => p.startDate && Number(p.startDate.slice(5, 7)) === month)
    .map((p) => {
      const startYear = Number(p.startDate.slice(0, 4));
      const day = Number(p.startDate.slice(8, 10));
      const years = year - startYear;
      return { name: p.name, day, month, years, isToday: day === today };
    })
    .filter((p) => p.years >= 1)
    .sort((a, b) => a.day - b.day);
  return { birthdays, anniversaries };
}
// Refresh the cached team OKR summary at most once every 24 h. Pulls every
// active group-level goal, groups by team, and rolls each team up to a
// single average-progress + worst-case-health snapshot for the dial screen.
export async function refreshOKRsIfStale() {
  const last = (await redis.get(OKRS_AT_KEY)) || 0;
  if (Date.now() - last < 24 * 60 * 60 * 1000) return;
  try {
    const token = await accessToken();
    const orgId = await resolveOrgId(token);
    const goals = [];
    let page = 1;
    while (true) {
      const data = await ehGet(
        `/organisations/${orgId}/goals?goal_type=group&status=active&page_index=${page}&item_per_page=100`,
        token
      );
      const items = data?.data?.items || [];
      goals.push(...items);
      if (items.length < 100) break;
      page += 1;
    }
    const byTeam = {};
    for (const g of goals) {
      if (!g.group_id) continue;
      if (!byTeam[g.group_id]) {
        byTeam[g.group_id] = { teamName: g.group_name || "Team", progresses: [], healthStatuses: [], goalCount: 0 };
      }
      const t = byTeam[g.group_id];
      t.progresses.push(Number(g.progress) || 0);
      if (g.health_status) t.healthStatuses.push(g.health_status);
      t.goalCount += 1;
    }
    const teams = Object.values(byTeam)
      .map((t) => {
        const avgProgress = Math.round(t.progresses.reduce((s, p) => s + p, 0) / (t.progresses.length || 1));
        const worstHealth =
          t.healthStatuses.sort((a, b) => (HEALTH_SEVERITY[b] || 0) - (HEALTH_SEVERITY[a] || 0))[0] || null;
        return { teamName: t.teamName, avgProgress, healthStatus: worstHealth, goalCount: t.goalCount };
      })
      .sort((a, b) => b.avgProgress - a.avgProgress);
    await redis.set(OKRS_KEY, teams);
    await redis.set(OKRS_AT_KEY, Date.now());
  } catch (e) {
    // Not connected, no OKRs entitlement, or transient failure — screen
    // simply won't show (hasOkrs stays false) until this succeeds.
    console.error("Employment Hero OKR refresh skipped:", e.message);
  }
}
export async function getTeamOKRs() {
  return (await redis.get(OKRS_KEY)) || [];
}
