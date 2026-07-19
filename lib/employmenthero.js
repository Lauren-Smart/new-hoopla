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

// People who'd rather not appear on the birthday/anniversary screens —
// add names exactly as they appear in Employment Hero.
export const EXCLUDED_NAMES = [];

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

// Refresh the cached people list (name + birthday day/month + start date)
// at most once every 24 h. Year of birth is deliberately never stored.
export async function refreshPeopleIfStale() {
  const last = (await redis.get(PEOPLE_AT_KEY)) || 0;
  if (Date.now() - last < 24 * 60 * 60 * 1000) return;
  try {
    const token = await accessToken();
    let orgId = process.env.EH_ORG_ID;
    if (!orgId) {
      const orgs = await ehGet("/organisations", token);
      orgId = orgs?.data?.items?.[0]?.id;
    }
    if (!orgId) throw new Error("No Employment Hero organisation found");

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
