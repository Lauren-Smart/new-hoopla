import { getJson, setJson, pushEvents } from "./redis";

// Watches the automation@ shared mailbox for project-delivery emails.
// Any new unread email in the inbox is treated as a project delivery:
//   subject line = project name (e.g. "P1843 - Shell Coles Express Dianella")
// Once handled, the email is marked read so it never fires twice.

const GRAPH = "https://graph.microsoft.com/v1.0";
const MAILBOX = "automation@smartcommercialenergy.com.au";
const TOKENS_KEY = "wb:mailtoken";

async function getAppToken() {
  const cached = await getJson("_mailtoken_cache");
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
  await setJson("_mailtoken_cache", { token: data.access_token, exp: Date.now() + data.expires_in * 1000 });
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

// Read any unread messages from the inbox, fire a delivery celebration
// for each subject, then mark them read. Also stashes them into the
// deliveries list so the Projects screen tally reflects them.
export async function checkMailbox() {
  const token = await getAppToken();
  const url = `/users/${MAILBOX}/mailFolders/Inbox/messages`
    + `?$filter=isRead eq false`
    + `&$select=id,subject,receivedDateTime`
    + `&$top=25&$orderby=receivedDateTime asc`;
  const list = await graphGet(url, token);
  const messages = list.value || [];
  if (!messages.length) return { newDeliveries: 0 };

  const deliveries = (await getJson("deliveries", [])) || [];
  const events = [];
  let added = 0;

  for (const m of messages) {
    const project = String(m.subject || "").trim();
    if (project) {
      const date = (m.receivedDateTime || "").slice(0, 10);
      if (!deliveries.some((d) => d.project === project && d.date === date)) {
        deliveries.unshift({ project, date });
        events.push({ kind: "delivery", project });
        added += 1;
      }
    }
    // Mark read so it never fires twice, even if the celebration fails.
    try {
      await graphPatch(`/users/${MAILBOX}/messages/${m.id}`, token, { isRead: true });
    } catch (e) {
      console.error("Failed to mark message read:", e.message);
    }
  }

  if (added) {
    await setJson("deliveries", deliveries.slice(0, 200));
    await pushEvents(events);
  }
  return { newDeliveries: added, scanned: messages.length };
}
