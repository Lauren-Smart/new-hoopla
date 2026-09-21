import { getJson, setJson, pushEvents } from "./redis";
import { redis } from "./redis";

// Watches the automation@ shared mailbox for project-delivery emails.
// Any message in the inbox is treated as a project delivery:
//   subject line = project name (e.g. "P1843 - Shell Coles Express Dianella")
// Each message's own ID is remembered once handled, so it is never
// registered twice. This does NOT depend on the email's read/unread
// state, because something outside our control (a rule, someone's
// Outlook reading pane, etc.) can mark a message read before we get
// to check it, which would otherwise hide it from us forever.

const GRAPH = "https://graph.microsoft.com/v1.0";
const MAILBOX = "automation@smartcommercialenergy.com.au";
const TOKEN_CACHE_KEY = "wb:mailtokenCache";
const HANDLED_KEY = "wb:mailHandledIds";
const HANDLED_MAX = 1000; // cap so this list never grows without bound

async function getAppToken() {
  const cached = await redis.get(TOKEN_CACHE_KEY);
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;

  const tenant = process.env.M365_TENANT_ID;
  const clientId = process.env.M365_CLIENT_ID;
  const secret = process.env.M365_CLIENT_SECRET;
  if (!tenant || !clientId || !secret) {
    throw new Error("M365_TENANT_ID / M365_CLIENT_ID / M365_CLIENT_SECRET not set");
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`M365 token: ${res.status} ${await res.text()}`);
  const data = await res.json();
  await redis.set(TOKEN_CACHE_KEY, { token: data.access_token, exp: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

async function graphGet(path, token) {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Graph GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function graphPatch(path, token, body) {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Graph PATCH ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

// Look at the most recent messages in the inbox regardless of read
// status, fire a delivery celebration for each one we haven't handled
// before (tracked by message ID, not by read/unread), then mark them
// read for mailbox tidiness. Also stashes them into the deliveries
// list so the Projects screen tally reflects them.
export async function checkMailbox() {
  const token = await getAppToken();
  const url = `/users/${MAILBOX}/mailFolders/Inbox/messages`
    + `?$select=id,subject,receivedDateTime,isRead`
    + `&$top=50&$orderby=receivedDateTime desc`;
  const list = await graphGet(url, token);
  const messages = list.value || [];
  if (!messages.length) return { newDeliveries: 0 };

  const handled = new Set((await redis.get(HANDLED_KEY)) || []);
  const deliveries = (await getJson("deliveries", [])) || [];
  const events = [];
  let added = 0;
  const newlyHandled = [];

  for (const m of messages) {
    if (handled.has(m.id)) continue; // already registered this exact message before

    const project = String(m.subject || "").trim();
    if (project) {
      const date = (m.receivedDateTime || "").slice(0, 10);
      if (!deliveries.some((d) => d.project === project && d.date === date)) {
        deliveries.unshift({ project, date });
        events.push({ kind: "delivery", project });
        added += 1;
      }
    }
    newlyHandled.push(m.id);

    // Mark read for mailbox tidiness only - no longer relied on for dedup.
    if (!m.isRead) {
      try {
        await graphPatch(`/users/${MAILBOX}/messages/${m.id}`, token, { isRead: true });
      } catch (e) {
        console.error("Failed to mark message read:", e.message);
      }
    }
  }

  if (newlyHandled.length) {
    newlyHandled.forEach((id) => handled.add(id));
    await redis.set(HANDLED_KEY, Array.from(handled).slice(-HANDLED_MAX));
  }

  if (added) {
    await setJson("deliveries", deliveries.slice(0, 200));
    await pushEvents(events);
  }
  return { newDeliveries: added, scanned: messages.length };
}
