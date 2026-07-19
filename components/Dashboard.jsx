"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SmartIcon from "./SmartIcon";
import { SALES_TEAM, PERFORMANCE_TEAM, FY_START } from "../lib/rosters";
import { CSS } from "./styles";

const STATE_POLL_MS = 5000;      // check for new celebration events every 5 s
const SYNC_MS = 2 * 60 * 1000;   // HubSpot safety-net sync every 2 min
const SCREEN_ROTATE_MS = 20000;  // rotate screens every 20 s
const CELEBRATION_MS = 14000;
const BRAND_CONFETTI = ["#B91982", "#B41E1E", "#FA7855", "#FAB419", "#82E196", "#46C1BE", "#6EC8F5", "#FFFFFF"];

// ── helpers ─────────────────────────────────────────────────
function fmtMoney(n) {
  if (n >= 1_000_000) return `A$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `A$${Math.round(n / 1_000)}K`;
  return `A$${Math.round(n).toLocaleString()}`;
}
const fmtMoneyFull = (n) => `A$${Math.round(n).toLocaleString("en-AU")}`;
function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" }); }
  catch { return d; }
}
const sydneyTime = () =>
  new Date().toLocaleTimeString("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit" });

function buildBoard(deals, roster) {
  const totals = {};
  Object.keys(roster).forEach((id) => (totals[id] = { name: roster[id], total: 0, count: 0 }));
  deals.forEach((d) => {
    if (roster[d.ownerId]) {
      totals[d.ownerId].total += Number(d.amount) || 0;
      totals[d.ownerId].count += 1;
    }
  });
  return Object.values(totals).sort((a, b) => b.total - a.total);
}

// ── celebration bits ────────────────────────────────────────
function Confetti() {
  const pieces = useRef(
    Array.from({ length: 130 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 2.2,
      duration: 3.2 + Math.random() * 2.6, size: 7 + Math.random() * 9,
      color: BRAND_CONFETTI[i % BRAND_CONFETTI.length],
      tilt: Math.random() * 360, drift: (Math.random() - 0.5) * 180,
    }))
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {pieces.current.map((p) => (
        <span key={p.id} style={{
          position: "absolute", top: "-4%", left: `${p.left}%`,
          width: p.size, height: p.size * 0.5, background: p.color,
          transform: `rotate(${p.tilt}deg)`,
          animation: `sw-fall ${p.duration}s linear ${p.delay}s infinite`,
          "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

function Celebration({ event, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [event, onDone]);
  const isDeal = event.kind === "deal";
  return (
    <div className="sw-celebration">
      <Confetti />
      <div className="sw-celebration-inner">
        <div className="sw-celebration-icon"><SmartIcon size={110} mono spin /></div>
        {isDeal ? (
          <>
            <div className="sw-eyebrow">{event.team === "performance" ? "Service contract won" : "Project sold"}</div>
            <h1 className="sw-headline">Deal Closed</h1>
            <p className="sw-dealname">{event.dealname}</p>
            <div className="sw-amount">{fmtMoneyFull(event.amount)}</div>
            <p className="sw-credit">Congratulations <strong>{event.owner}</strong></p>
          </>
        ) : (
          <>
            <div className="sw-eyebrow">Project delivered</div>
            <h1 className="sw-headline">Great News</h1>
            <p className="sw-delivery-msg">
              <strong>{event.project}</strong> has now been completed and handed over to
              Performance. Well done to the team on delivering another successful project!
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── screens ─────────────────────────────────────────────────
function Board({ title, subtitle, rows, accent, total }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <section className="sw-board" style={{ "--accent": accent }}>
      <header className="sw-board-head">
        <div>
          <div className="sw-board-eyebrow">{subtitle}</div>
          <h2>{title}</h2>
        </div>
        <div className="sw-board-total"><span>{fmtMoney(total)}</span><small>FYTD</small></div>
      </header>
      <ol className="sw-rows">
        {rows.map((r, i) => (
          <li key={r.name} className="sw-row">
            <span className={`sw-rank ${i === 0 && r.total > 0 ? "sw-rank-top" : ""}`}>{i + 1}</span>
            <div className="sw-row-body">
              <div className="sw-row-line">
                <span className="sw-name">{r.name}</span>
                <span className="sw-val">
                  {r.total > 0 ? fmtMoney(r.total) : "—"}
                  {r.count > 0 && <em> · {r.count} {r.count === 1 ? "win" : "wins"}</em>}
                </span>
              </div>
              <div className="sw-bar"><div className="sw-bar-fill" style={{ width: `${(r.total / max) * 100}%` }} /></div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SalesScreen({ deals }) {
  const salesRows = buildBoard(deals, SALES_TEAM);
  const perfRows = buildBoard(deals, PERFORMANCE_TEAM);
  return (
    <main className="sw-main sw-two-col">
      <Board title="Project Sales" subtitle="Solar · Storage · EV Projects"
        rows={salesRows} accent="#FAB419" total={salesRows.reduce((s, r) => s + r.total, 0)} />
      <Board title="Performance" subtitle="Service Contracts · Asset Care"
        rows={perfRows} accent="#46C1BE" total={perfRows.reduce((s, r) => s + r.total, 0)} />
    </main>
  );
}

function ProjectsScreen({ deliveries }) {
  const fytd = deliveries.filter((d) => !d.date || d.date >= FY_START);
  return (
    <main className="sw-main sw-projects">
      <div className="sw-tally">
        <div className="sw-board-eyebrow">Projects delivered · FYTD</div>
        <div className="sw-tally-number">{fytd.length}</div>
        <div className="sw-tally-sub">handed over to Performance</div>
      </div>
      <div className="sw-delivery-list">
        <div className="sw-board-eyebrow">Most recent</div>
        {fytd.length === 0 && <p className="sw-empty">The first delivery of the financial year is coming soon…</p>}
        <ul>
          {fytd.slice(0, 8).map((d, i) => (
            <li key={`${d.project}-${i}`}>
              <span className="sw-delivery-name">{d.project}</span>
              <span className="sw-delivery-date">{fmtDate(d.date)}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function AnnouncementsScreen({ announcements, deals, deliveries, ownerNameOf }) {
  const hasCustom = announcements.length > 0;
  return (
    <main className="sw-main sw-announce">
      <div className="sw-announce-head">
        <div className="sw-board-eyebrow">Announcements</div>
        <h2>What&apos;s On</h2>
      </div>
      {hasCustom ? (
        <ul className="sw-announce-list">
          {announcements.slice(0, 6).map((a) => (
            <li key={a.id}>
              <span className="sw-announce-msg">{a.message}</span>
              {a.date && <span className="sw-announce-date">{fmtDate(a.date)}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="sw-announce-fallback">
          <p className="sw-empty">No announcements posted. Latest wins across the business:</p>
          <ul className="sw-announce-list">
            {deals.slice(0, 4).map((d) => (
              <li key={d.id}>
                <span className="sw-announce-msg">{d.dealname} — {ownerNameOf(d.ownerId)}</span>
                <span className="sw-announce-date">{fmtMoney(Number(d.amount) || 0)}</span>
              </li>
            ))}
            {deliveries.slice(0, 2).map((d, i) => (
              <li key={`del-${i}`}>
                <span className="sw-announce-msg">Delivered: {d.project}</span>
                <span className="sw-announce-date">{fmtDate(d.date)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function PhotosScreen({ photos, tick }) {
  if (!photos.length) return null;
  const photo = photos[tick % photos.length];
  return (
    <main className="sw-main sw-photos">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" className="sw-photo" />
    </main>
  );
}


function CelebrantsScreen({ title, eyebrow, items, accent, unit }) {
  return (
    <main className="sw-main sw-announce">
      <div className="sw-announce-head">
        <div className="sw-board-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="sw-empty">None this month.</p>
      ) : (
        <ul className="sw-celebrant-list" style={{ "--accent": accent }}>
          {items.map((p, i) => (
            <li key={`${p.name}-${i}`} className={p.isToday ? "sw-today" : ""}>
              <span className="sw-celebrant-name">
                {p.name}
                {p.isToday && <em className="sw-today-tag">Today!</em>}
              </span>
              <span className="sw-celebrant-detail">
                {fmtDate(`2026-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`)}
                {unit === "years" && ` · ${p.years} ${p.years === 1 ? "year" : "years"}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// ── main ────────────────────────────────────────────────────
export default function Dashboard() {
  const [state, setState] = useState({ deals: [], deliveries: [], announcements: [], photos: [], birthdays: [], anniversaries: [] });
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState(null);
  const [screen, setScreen] = useState(0);
  const [photoTick, setPhotoTick] = useState(0);
  const [status, setStatus] = useState("Connecting…");
  const [clock, setClock] = useState("");
  const cursor = useRef(-1);

  const ownerNameOf = useCallback(
    (id) => SALES_TEAM[id] || PERFORMANCE_TEAM[id] || "The team", []
  );

  const screens = [
    "sales", "projects", "announcements",
    ...(state.photos.length ? ["photos"] : []),
    ...(state.birthdays.length ? ["birthdays"] : []),
    ...(state.anniversaries.length ? ["anniversaries"] : []),
  ];
  const current = screens[screen % screens.length];

  const pollState = useCallback(async () => {
    try {
      const res = await fetch(`/api/state?since=${cursor.current}`, { cache: "no-store" });
      const data = await res.json();
      setState({
        deals: data.deals || [], deliveries: data.deliveries || [],
        announcements: data.announcements || [], photos: data.photos || [],
        birthdays: data.birthdays || [], anniversaries: data.anniversaries || [],
      });
      if (cursor.current >= 0 && data.events?.length) {
        setQueue((q) => [...q, ...data.events]);
      }
      cursor.current = data.latestEventId ?? cursor.current;
      setStatus(`Live · updated ${sydneyTime()}`);
    } catch {
      setStatus("Connection hiccup — retrying…");
    }
  }, []);

  const sync = useCallback(() => { fetch("/api/sync", { cache: "no-store" }).catch(() => {}); }, []);

  useEffect(() => {
    setClock(sydneyTime());
    sync();
    pollState();
    const stateId = setInterval(pollState, STATE_POLL_MS);
    const syncId = setInterval(sync, SYNC_MS);
    const clockId = setInterval(() => setClock(sydneyTime()), 15000);
    return () => { clearInterval(stateId); clearInterval(syncId); clearInterval(clockId); };
  }, [pollState, sync]);

  // Screen rotation — pauses while a celebration is on screen
  useEffect(() => {
    if (active) return;
    const id = setInterval(() => {
      setScreen((s) => s + 1);
      setPhotoTick((t) => t + 1);
    }, SCREEN_ROTATE_MS);
    return () => clearInterval(id);
  }, [active]);

  // Celebration queue
  useEffect(() => {
    if (!active && queue.length) {
      setActive(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [queue, active]);

  const tag = { sales: "Wins Board", projects: "Delivery Board", announcements: "Noticeboard", photos: "Gallery", birthdays: "Celebrations", anniversaries: "Milestones" }[current];

  return (
    <div className="sw-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sw-circle sw-circle-a" aria-hidden="true" />
      <div className="sw-circle sw-circle-b" aria-hidden="true" />

      <header className="sw-header">
        <div className="sw-brand">
          <SmartIcon size={44} />
          <div>
            <span className="sw-logo-word">Smart Commercial Energy</span>
            <span className="sw-logo-tag">{tag}</span>
          </div>
        </div>
        <div className="sw-header-right">
          <span className="sw-status">{status}</span>
          <span className="sw-clock">{clock} AEST</span>
        </div>
      </header>

      <div className="sw-screen" key={current + (current === "photos" ? photoTick : "")}>
        {current === "sales" && <SalesScreen deals={state.deals} />}
        {current === "projects" && <ProjectsScreen deliveries={state.deliveries} />}
        {current === "announcements" && (
          <AnnouncementsScreen announcements={state.announcements} deals={state.deals}
            deliveries={state.deliveries} ownerNameOf={ownerNameOf} />
        )}
        {current === "photos" && <PhotosScreen photos={state.photos} tick={photoTick} />}
        {current === "birthdays" && (
          <CelebrantsScreen title="Happy Birthday" eyebrow="Birthdays this month"
            items={state.birthdays} accent="#B91982" unit="date" />
        )}
        {current === "anniversaries" && (
          <CelebrantsScreen title="Work Anniversaries" eyebrow="Milestones this month"
            items={state.anniversaries} accent="#FA7855" unit="years" />
        )}
      </div>

      <footer className="sw-footer">
        <div className="sw-dots">
          {screens.map((s, i) => (
            <button key={s} className={`sw-dot ${i === screen % screens.length ? "sw-dot-on" : ""}`}
              onClick={() => setScreen(i)} aria-label={s} />
          ))}
        </div>
      </footer>

      {active && <Celebration key={active.id ?? "e"} event={active} onDone={() => setActive(null)} />}
    </div>
  );
}
