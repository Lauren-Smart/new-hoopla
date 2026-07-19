import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

const KEYS = {
  deals: "wb:deals",
  deliveries: "wb:deliveries",
  announcements: "wb:announcements",
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
// TV clients can ask "anything since event N?"
export async function pushEvents(newEvents) {
  if (!newEvents.length) return;
  const seq = await redis.incrby(KEYS.eventSeq, newEvents.length);
  const events = (await redis.get(KEYS.events)) || [];
  newEvents.forEach((e, i) => events.push({ ...e, id: seq - newEvents.length + 1 + i, at: Date.now() }));
  await redis.set(KEYS.events, events.slice(-100));
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
