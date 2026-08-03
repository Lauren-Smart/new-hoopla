"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SmartIcon from "./SmartIcon";
import { SALES_TEAM, PERFORMANCE_TEAM, FY_START } from "../lib/rosters";
import { CSS } from "./styles";

const STATE_POLL_MS = 5000;      // check for new celebration events every 5 s
const SYNC_MS = 2 * 60 * 1000;   // HubSpot safety-net sync every 2 min
const SCREEN_ROTATE_MS = 10000;  // rotate screens every 20 s
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
    <main className="sw-main sw-sales">
      <header className="sw-screen-head">
        <div className="sw-board-eyebrow">Sales Leaderboards · FYTD</div>
        <h2>The Wins Board</h2>
      </header>
      <div className="sw-two-col">
        <Board title="Project Sales" subtitle="Solar · Storage · EV Projects"
          rows={salesRows} accent="#FAB419" total={salesRows.reduce((s, r) => s + r.total, 0)} />
        <Board title="Performance" subtitle="Service Contracts · Asset Care"
          rows={perfRows} accent="#46C1BE" total={perfRows.reduce((s, r) => s + r.total, 0)} />
      </div>
    </main>
  );
}

function ProjectsScreen({ deliveries }) {
  const fytd = deliveries.filter((d) => !d.date || d.date >= FY_START);
  return (
    <main className="sw-main sw-projects">
      <header className="sw-screen-head">
        <div className="sw-board-eyebrow">Delivery</div>
        <h2>Projects Delivered</h2>
      </header>
      <div className="sw-projects-body">
        <div className="sw-tally">
          <div className="sw-board-eyebrow">FYTD tally</div>
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
      </div>
    </main>
  );
}

function AnnouncementsScreen() { return null; } // replaced by ThisMonthScreen (kept as safe stub)

// Small decorative confetti flecks that DON'T animate — just a festive garnish.
function ConfettiFlecks({ count = 14 }) {
  const flecks = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 5 + Math.random() * 8, tilt: Math.random() * 360,
      color: BRAND_CONFETTI[i % BRAND_CONFETTI.length],
      opacity: 0.35 + Math.random() * 0.45,
    }))
  );
  return (
    <div className="sw-flecks" aria-hidden="true">
      {flecks.current.map((f) => (
        <span key={f.id} style={{
          left: `${f.x}%`, top: `${f.y}%`,
          width: f.size, height: f.size * 0.5,
          background: f.color, transform: `rotate(${f.tilt}deg)`,
          opacity: f.opacity,
        }} />
      ))}
    </div>
  );
}

// Tiny brand pinwheel used as a bullet on the This Month screen.
function MiniPinwheel({ color = "#FAB419" }) {
  return (
    <svg viewBox="-50 -50 100 100" width={16} height={16} aria-hidden="true">
      {[0,1,2,3,4,5,6,7].map((i) => (
        <path key={i} d="M -8,-46 L 12,-41 L 8,-17 L -12,-22 Z"
          fill={color} transform={`rotate(${i * 45})`} opacity={0.85} />
      ))}
    </svg>
  );
}

function ThisMonthScreen({ birthdays, anniversaries, announcements }) {
  const isEmpty = !birthdays.length && !anniversaries.length && !announcements.length;
  return (
    <main className="sw-main sw-thismonth">
      <ConfettiFlecks />
      <header className="sw-thismonth-head sw-screen-head">
        <div className="sw-board-eyebrow">Team news</div>
        <h2>This Month at Smart</h2>
      </header>

      {isEmpty ? (
        <p className="sw-empty">Nothing to report yet this month — post something at /admin.</p>
      ) : (
        <div className="sw-thismonth-grid">
          <section className="sw-tm-panel" style={{ "--accent": "#B91982" }}>
            <div className="sw-tm-panel-head">
              <MiniPinwheel color="#B91982" />
              <h3>Birthdays</h3>
            </div>
            {birthdays.length === 0 ? (
              <p className="sw-tm-empty">No birthdays this month.</p>
            ) : (
              <ul>
                {birthdays.map((p, i) => (
                  <li key={`b-${i}`} className={p.isToday ? "sw-today" : ""}>
                    <span className="sw-tm-name">
                      {p.name}
                      {p.isToday && <em className="sw-today-tag">Today!</em>}
                    </span>
                    <span className="sw-tm-detail">
                      {fmtDate(`2026-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sw-tm-panel" style={{ "--accent": "#FA7855" }}>
            <div className="sw-tm-panel-head">
              <MiniPinwheel color="#FA7855" />
              <h3>Anniversaries</h3>
            </div>
            {anniversaries.length === 0 ? (
              <p className="sw-tm-empty">No anniversaries this month.</p>
            ) : (
              <ul>
                {anniversaries.map((p, i) => (
                  <li key={`a-${i}`} className={p.isToday ? "sw-today" : ""}>
                    <span className="sw-tm-name">
                      {p.name}
                      {p.isToday && <em className="sw-today-tag">Today!</em>}
                    </span>
                    <span className="sw-tm-detail">{p.years} {p.years === 1 ? "year" : "years"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sw-tm-panel sw-tm-panel-wide" style={{ "--accent": "#6EC8F5" }}>
            <div className="sw-tm-panel-head">
              <MiniPinwheel color="#6EC8F5" />
              <h3>Announcements</h3>
            </div>
            {announcements.length === 0 ? (
              <p className="sw-tm-empty">No announcements posted.</p>
            ) : (
              <ul>
                {announcements.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <span className="sw-tm-msg">{a.message}</span>
                    {a.date && <span className="sw-tm-detail">{fmtDate(a.date)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function SmartZeroScreen({ smartZero }) {
  const { stages = [], sold = 0, goal = 250000 } = smartZero || {};
  const pctToGoal = Math.min(100, (sold / goal) * 100);
  const maxStageDollars = Math.max(...stages.map((s) => s.dollars), 1);
  const totalInFunnel = stages.reduce((s, x) => s + x.dollars, 0);
  const totalDeals = stages.reduce((s, x) => s + x.count, 0);

  return (
    <main className="sw-main sw-zero">
      <header className="sw-zero-head sw-screen-head">
        <div className="sw-board-eyebrow">Pipeline</div>
        <h2>Smart Zero</h2>
      </header>
      <div className="sw-zero-goal">
        <div className="sw-board-eyebrow">Sold toward $250K</div>
        <div className="sw-zero-goal-number">{fmtMoney(sold)}</div>
        <div className="sw-zero-goal-of">of {fmtMoney(goal)}</div>
        <div className="sw-zero-goal-bar">
          <div className="sw-zero-goal-fill" style={{ width: `${pctToGoal}%` }} />
        </div>
        <div className="sw-zero-goal-pct">{pctToGoal.toFixed(0)}% of goal</div>
        <div className="sw-zero-summary">
          <div>
            <span className="sw-zero-summary-n">{totalDeals}</span>
            <span className="sw-zero-summary-l">deals in play</span>
          </div>
          <div>
            <span className="sw-zero-summary-n">{fmtMoney(totalInFunnel)}</span>
            <span className="sw-zero-summary-l">pipeline value</span>
          </div>
        </div>
      </div>

      <div className="sw-zero-funnel">
        <div className="sw-board-eyebrow">Pipeline stages</div>
        <ul>
          {stages.map((s, i) => {
            const width = (s.dollars / maxStageDollars) * 100;
            return (
              <li key={s.id}>
                <div className="sw-zero-stage-head">
                  <span className="sw-zero-stage-name">{s.name}</span>
                  <span className="sw-zero-stage-nums">
                    {s.count} {s.count === 1 ? "deal" : "deals"} · {fmtMoney(s.dollars)}
                  </span>
                </div>
                <div className="sw-zero-bar">
                  <div className="sw-zero-bar-fill" style={{
                    width: `${Math.max(width, s.dollars > 0 ? 4 : 0)}%`,
                    opacity: 0.55 + (i * 0.15),
                  }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

function GpScreen({ gp }) {
  const { avgPercent = 0, goalPercent = 20, dealsCounted = 0, totalDollars = 0 } = gp || {};
  const displayPercent = avgPercent * 100;
  const onTarget = displayPercent >= goalPercent;
  const gap = displayPercent - goalPercent;
  return (
    <main className="sw-main sw-gp">
      <header className="sw-screen-head">
        <div className="sw-board-eyebrow">Performance</div>
        <h2>GP Margin Watch</h2>
      </header>
      <div className="sw-gp-inner">
        <div className="sw-board-eyebrow">Average gross margin · FYTD</div>
        <div className={`sw-gp-number ${onTarget ? "sw-gp-on" : "sw-gp-off"}`}>
          {(avgPercent * 100).toFixed(1)}<span className="sw-gp-percent">%</span>
        </div>
        <div className="sw-gp-target">
          Target <strong>{goalPercent}%</strong>
          {dealsCounted > 0 && (
            <span className="sw-gp-gap">
              {onTarget ? "▲" : "▼"} {Math.abs(gap).toFixed(1)} pts {onTarget ? "above" : "below"} target
            </span>
          )}
        </div>
        <div className="sw-gp-basis">
          Weighted across {dealsCounted} closed-won {dealsCounted === 1 ? "deal" : "deals"}
          {totalDollars > 0 && ` (${fmtMoney(totalDollars)})`}
        </div>
      </div>
    </main>
  );
}


function CelebrantsScreen() { return null; } // replaced by ThisMonthScreen (kept as safe stub)

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


// ── Marketing screens ───────────────────────────────────────
function TrendArrow({ change, isPositiveBetter = true, isPercentPoints = false }) {
  if (change == null) return null;
  const up = change >= 0;
  const good = up === isPositiveBetter;
  const cls = `sw-mkt-trend ${good ? "sw-mkt-up" : "sw-mkt-down"}`;
  const sign = up ? "▲" : "▼";
  const magnitude = Math.abs(change);
  const suffix = isPercentPoints ? "pts" : "%";
  return <span className={cls}>{sign} {magnitude.toFixed(magnitude >= 100 ? 0 : 1)}{suffix}</span>;
}

function MktCard({ label, value, unit = "", change, isPositiveBetter = true, isPercentPoints = false }) {
  const display = value == null
    ? "—"
    : unit === "%" ? `${Number(value).toFixed(1)}${unit}`
    : typeof value === "number" ? Math.round(value).toLocaleString("en-AU")
    : value;
  return (
    <div className="sw-mkt-card">
      <div className="sw-mkt-label">{label}</div>
      <div className="sw-mkt-value">{display}</div>
      <TrendArrow change={change} isPositiveBetter={isPositiveBetter} isPercentPoints={isPercentPoints} />
    </div>
  );
}

function MarketingPulseScreen({ marketing }) {
  const m = marketing || {};
  return (
    <main className="sw-main sw-mkt sw-mkt-pulse">
      <header className="sw-screen-head">
        <div className="sw-board-eyebrow">Last 30 days vs prior 30</div>
        <h2>Marketing · The Pulse</h2>
      </header>
      <div className="sw-mkt-grid">
        <MktCard label="Sessions" value={m.sessions?.value} change={m.sessions?.change} />
        <MktCard label="New Contacts" value={m.newContacts?.value} change={m.newContacts?.change} />
        <MktCard label="New Customers" value={m.customers?.value} change={m.customers?.change} />
        <MktCard label="Social Interactions" value={m.socialInteractions?.value} change={m.socialInteractions?.change} />
        <MktCard label="Conversion Rate" value={m.conversionRate?.value} unit="%" change={m.conversionRate?.change} isPercentPoints />
        <MktCard label="Blog Views" value={m.blogViews?.value} change={m.blogViews?.change} />
      </div>
    </main>
  );
}

function MarketingLeadsScreen({ marketing }) {
  const m = marketing || {};
  const sold = m.leads?.sold ?? 0;
  const goal = m.leads?.goal ?? 7_000_000;
  const pct = Math.min(100, (sold / goal) * 100);
  const lp = m.landingPages || {};
  return (
    <main className="sw-main sw-mkt sw-mkt-leads">
      <header className="sw-screen-head">
        <div className="sw-board-eyebrow">FY27 Marketing Goal · Landing Pages</div>
        <h2>Marketing · Leads &amp; Pipeline</h2>
      </header>
      <div className="sw-mkt-goal">
        <div className="sw-board-eyebrow">Marketing-attributed pipeline · FYTD</div>
        <div className="sw-mkt-goal-number">{fmtMoney(sold)}</div>
        <div className="sw-mkt-goal-of">of {fmtMoney(goal)} FY27 goal</div>
        <div className="sw-mkt-goal-bar">
          <div className="sw-mkt-goal-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="sw-mkt-goal-pct">{pct.toFixed(1)}% of goal</div>
      </div>
      <div className="sw-mkt-lp">
        <div className="sw-board-eyebrow">Landing pages · Last 30 days</div>
        <div className="sw-mkt-lp-row">
          <MktCard label="Views" value={lp.views} change={lp.viewsChange} />
          <MktCard label="Submissions" value={lp.submissions} change={lp.submissionsChange} />
          <MktCard label="Conversion Rate" value={lp.conversionRate} unit="%" change={lp.conversionChange} isPercentPoints />
        </div>
      </div>
    </main>
  );
}

// ── main ────────────────────────────────────────────────────
export default function Dashboard() {
  const [state, setState] = useState({
    deals: [], deliveries: [], announcements: [], photos: [],
    birthdays: [], anniversaries: [],
    smartZero: { stages: [], sold: 0, goal: 250000 },
    gp: { avgPercent: 0, goalPercent: 20, dealsCounted: 0, totalDollars: 0 },
    marketing: null,
  });
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState(null);
  const [screen, setScreen] = useState(0);
  const [photoTick, setPhotoTick] = useState(0);
  const [status, setStatus] = useState("Connecting…");
  const [clock, setClock] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const cursor = useRef(-1);
  const audioRef = useRef(null);          // fanfare — plays on deal celebrations
  const deliveryAudioRef = useRef(null);  // separate sound for project deliveries

  // Remember the sound preference; browsers still need one click per
  // session before audio is allowed, which the speaker button provides.
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("wb-sound") === "on") {
      setSoundOn(true);
    }
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem("wb-sound", next ? "on" : "off");
    if (next) {
      // The click itself unlocks audio for the whole page — prime both
      // elements silently so either can play the moment its cue arrives.
      [audioRef.current, deliveryAudioRef.current].forEach((a) => {
        if (!a) return;
        a.volume = 0;
        a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1; }).catch(() => {});
      });
    }
  };

  // Play the matching sound when a celebration takes the screen —
  // fanfare (crowd cheer) for deal closes, delivery sound for project handovers.
  useEffect(() => {
    if (!active || !soundOn) return;
    const a = active.kind === "delivery" ? deliveryAudioRef.current : audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.volume = 1;
    a.play().catch(() => {});
  }, [active, soundOn]);

  const ownerNameOf = useCallback(
    (id) => SALES_TEAM[id] || PERFORMANCE_TEAM[id] || "The team", []
  );

  const hasThisMonth = state.birthdays.length || state.anniversaries.length || state.announcements.length;
  const hasSmartZero = (state.smartZero?.stages || []).some((s) => s.count > 0);
  const hasGp = (state.gp?.dealsCounted || 0) > 0;
  const hasMarketing = !!state.marketing;

  const screens = [
    "sales",
    ...(hasGp ? ["gp"] : []),
    "projects",
    ...(hasSmartZero ? ["smartzero"] : []),
    ...(hasMarketing ? ["mktpulse", "mktleads"] : []),
    ...(hasThisMonth ? ["thismonth"] : []),
    ...(state.photos.length ? ["photos"] : []),
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
        smartZero: data.smartZero || { stages: [], sold: 0, goal: 250000 },
        gp: data.gp || { avgPercent: 0, goalPercent: 20, dealsCounted: 0, totalDollars: 0 },
        marketing: data.marketing || null,
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

  const tag = {
    sales: "Wins Board",
    gp: "Margin Watch",
    projects: "Delivery Board",
    smartzero: "Smart Zero Pipeline",
    mktpulse: "Marketing Pulse",
    mktleads: "Marketing Goals",
    thismonth: "This Month at Smart",
    photos: "Gallery",
  }[current];

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
          <button className="sw-sound" onClick={toggleSound}
            title={soundOn ? "Sound on" : "Sound off"}>
            {soundOn ? "\u{1F50A}" : "\u{1F507}"}
          </button>
        </div>
      </header>
      <audio ref={audioRef} src="/fanfare.mp3" preload="auto" />
      <audio ref={deliveryAudioRef} src="/delivery.mp3" preload="auto" />

      <div className="sw-screen" key={current + (current === "photos" ? photoTick : "")}>
        {current === "sales" && <SalesScreen deals={state.deals} />}
        {current === "gp" && <GpScreen gp={state.gp} />}
        {current === "projects" && <ProjectsScreen deliveries={state.deliveries} />}
        {current === "smartzero" && <SmartZeroScreen smartZero={state.smartZero} />}
        {current === "mktpulse" && <MarketingPulseScreen marketing={state.marketing} />}
        {current === "mktleads" && <MarketingLeadsScreen marketing={state.marketing} />}
        {current === "thismonth" && (
          <ThisMonthScreen
            birthdays={state.birthdays}
            anniversaries={state.anniversaries}
            announcements={state.announcements}
          />
        )}
        {current === "photos" && <PhotosScreen photos={state.photos} tick={photoTick} />}
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
