import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

const KEYS = {
  deals: "wb:deals",
  deliveries: "wb:deliveries",
  announcements: "wb:announcements",
  smartZero: "wb:smartZero",
  events: "wb:events",
  eventSeq: "wb:eventSeq",
  baselined: "wb:baselined",
};

export async function getJson(key, fallback) {
  const v = await redis.get(KEYS[key]);
  return v ?? fallback;
}
export async function setJson(key, value) {
  await redis.set(KEYS[key], value);
}

// Events are an append-only capped list with an incrementing id so
// screens can ask "anything since event N?". A short lock stops two syncs
// that run at the same moment from overwriting each other's events.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function pushEvents(newEvents) {
  if (!newEvents.length) return;
  let locked = false;
  for (let i = 0; i < 25 && !locked; i++) {
    locked = (await redis.set("wb:eventLock", 1, { nx: true, px: 8000 })) === "OK";
    if (!locked) await sleep(200);
  }
  try {
    const seq = await redis.incrby(KEYS.eventSeq, newEvents.length);
    const events = (await redis.get(KEYS.events)) || [];
    newEvents.forEach((e, i) => events.push({ ...e, id: seq - newEvents.length + 1 + i, at: Date.now() }));
    await redis.set(KEYS.events, events.slice(-100));
  } finally {
    if (locked) await redis.del("wb:eventLock");
  }
}

// Returns only the deal IDs that have never been celebrated before.
// SADD is atomic, so even if two syncs spot the same win together,
// only one of them gets to celebrate it.
export async function claimNewDeals(ids) {
  const fresh = [];
  for (const id of ids) {
    if ((await redis.sadd("wb:celebratedDeals", id)) === 1) fresh.push(id);
  }
  return fresh;
}
// If a celebration could not be queued, release its deals so the next
// sync tries again instead of losing the win.
export async function releaseDeals(ids) {
  if (ids.length) await redis.srem("wb:celebratedDeals", ...ids);
}

// Each screen showing the board checks in every couple of minutes so we
// can see from /admin whether the office TV is actually awake and working.
export async function saveHeartbeat(screenId, info) {
  await redis.hset("wb:screens", { [screenId]: { ...info, seen: Date.now() } });
}
export async function getScreens() {
  const all = (await redis.hgetall("wb:screens")) || {};
  const screens = Object.entries(all).map(([id, v]) => ({ id, ...(typeof v === "string" ? JSON.parse(v) : v) }));
  // Forget screens that haven't checked in for a week (old laptops etc.)
  const stale = screens.filter((s) => Date.now() - (s.seen || 0) > 7 * 24 * 60 * 60 * 1000).map((s) => s.id);
  if (stale.length) await redis.hdel("wb:screens", ...stale);
  return screens.filter((s) => !stale.includes(s.id));
}
export async function getEventsSince(sinceId) {
  const events = (await redis.get(KEYS.events)) || [];
  return events.filter((e) => e.id > sinceId);
}
export async function getLatestEventId() {
  return (await redis.get(KEYS.eventSeq)) || 0;
}
export async function isBaselined() {
  return Boolean(await redis.get(KEYS.baselined));
}
export async function setBaselined() {
  await redis.set(KEYS.baselined, 1);
}
