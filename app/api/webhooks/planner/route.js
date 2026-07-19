import { NextResponse } from "next/server";
import { getJson, setJson, pushEvents } from "../../../../lib/redis";

export const dynamic = "force-dynamic";

// Point the Power Automate flow's HTTP action here:
//   POST https://YOUR-APP.vercel.app/api/webhooks/planner?secret=WEBHOOK_SECRET
//   Body: { "project": "P1843 - Shell Coles Express Dianella" }
// Fires the "Great news!" celebration and adds to the FYTD delivery tally.
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const project = String(body.project || "").trim();
  if (!project) {
    return NextResponse.json({ ok: false, error: "Missing 'project' in body" }, { status: 400 });
  }
  const date = String(body.date || new Date().toISOString().slice(0, 10));

  const deliveries = (await getJson("deliveries", [])) || [];
  if (!deliveries.some((d) => d.project === project && d.date === date)) {
    deliveries.unshift({ project, date });
    await setJson("deliveries", deliveries.slice(0, 200));
    await pushEvents([{ kind: "delivery", project }]);
  }
  return NextResponse.json({ ok: true });
}
