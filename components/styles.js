// Brand Identity Guideline 2026:
// Core: Deep Purple #463282, Indigo Blue #28066C, Sky Blue #6EC8F5,
//       Lighter Sky Blue #9DD9F7, Ice Grey #FAFAFC
// Accents: Magenta #B91982, Brick Red #B41E1E, Peach #FA7855,
//          Golden Yellow #FAB419, Fresh Green #82E196, Turquoise #46C1BE
// Gradient: linear Indigo -> Deep Purple (never radial)
// Type: Barlow (headings, uppercase, tracked) / Overpass (body, eyebrows)
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500&family=Overpass:wght@400;600;800&display=swap');

.sw-root {
  --indigo: #28066C; --deep-purple: #463282;
  --sky: #6EC8F5; --light-sky: #9DD9F7; --ice: #FAFAFC;
  --gold: #FAB419; --turquoise: #46C1BE;
  position: relative; min-height: 100vh;
  background: linear-gradient(100deg, var(--indigo) 0%, var(--deep-purple) 100%);
  color: var(--ice);
  font-family: 'Overpass', system-ui, sans-serif;
  display: flex; flex-direction: column; overflow: hidden;
}
.sw-circle { position: absolute; border-radius: 50%; border: 1.5px solid rgba(110,200,245,0.35); pointer-events: none; }
.sw-circle-a { width: 46vmax; height: 46vmax; left: -16vmax; top: -20vmax; }
.sw-circle-b { width: 20vmax; height: 20vmax; right: -6vmax; bottom: -8vmax; border-color: rgba(157,217,247,0.22); }

.sw-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 72px 14px; border-bottom: 1px solid rgba(250,250,252,0.14);
  position: relative; z-index: 2;
}
.sw-brand { display: flex; align-items: center; gap: 16px; }
.sw-logo-word {
  display: block; font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: 28px; letter-spacing: 0.22em; line-height: 1.15;
  text-transform: uppercase; color: #FFFFFF;
}
.sw-logo-tag {
  display: block; font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 14px; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--sky); margin-top: 4px;
}
.sw-header-right { display: flex; align-items: center; gap: 18px; }
.sw-status { font-size: 15px; color: rgba(250,250,252,0.55); }
.sw-clock { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: 24px; letter-spacing: 0.12em; }

.sw-sound {
  background: none; border: 1px solid rgba(250,250,252,0.2); color: rgba(250,250,252,0.7);
  border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 14px; line-height: 1;
}
.sw-sound:hover { color: #FAFAFC; }

.sw-screen { flex: 1; min-height: 0; display: flex; flex-direction: column; animation: sw-screenin 0.7s ease; position: relative; z-index: 2; overflow: hidden; }
@keyframes sw-screenin { from { opacity: 0; transform: translateX(28px); } }

.sw-main { flex: 1; min-height: 0; padding: 32px 72px 16px; align-content: start; }
.sw-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }

/* Consistent big screen heading across all screens */
.sw-screen-head {
  margin-bottom: 30px; position: relative; z-index: 2;
}
.sw-screen-head .sw-board-eyebrow { margin-bottom: 8px; color: var(--sky); }
.sw-screen-head h2 {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(34px, 3.6vw, 54px); margin: 0; line-height: 1;
  letter-spacing: 0.14em; text-transform: uppercase; color: #FFFFFF;
}
.sw-sales, .sw-projects, .sw-gp { display: flex; flex-direction: column; min-height: 0; }
.sw-sales .sw-two-col { flex: 1; min-height: 0; }

.sw-board { min-width: 0; }
.sw-board-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid var(--accent);
}
.sw-board-eyebrow {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 16px; letter-spacing: 0.26em; text-transform: uppercase;
  color: var(--sky); margin-bottom: 6px;
}
.sw-board-head h2 {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(24px, 2.2vw, 34px); margin: 0; line-height: 1;
  letter-spacing: 0.14em; text-transform: uppercase; color: #FFFFFF;
}
.sw-board-total { text-align: right; }
.sw-board-total span {
  font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(20px, 1.8vw, 30px);
  display: block; line-height: 1; letter-spacing: 0.04em; color: var(--accent);
}
.sw-board-total small {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 14px; letter-spacing: 0.26em; color: rgba(250,250,252,0.5);
}
.sw-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.sw-row { display: flex; gap: 14px; align-items: center; }
.sw-rank {
  font-family: 'Overpass', sans-serif; font-weight: 800; font-size: 13px;
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(250,250,252,0.25); color: rgba(250,250,252,0.6);
  flex-shrink: 0; padding-top: 1px;
}
.sw-rank-top { background: var(--accent); color: var(--indigo); border-color: var(--accent); }
.sw-row-body { flex: 1; min-width: 0; }
.sw-row-line { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.sw-name {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(16px, 1.3vw, 19px); letter-spacing: 0.03em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sw-val { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(14px, 1.1vw, 17px); white-space: nowrap; letter-spacing: 0.03em; }
.sw-val em { font-style: normal; font-family: 'Overpass', sans-serif; font-weight: 400; font-size: 0.65em; color: rgba(250,250,252,0.55); }
.sw-bar { height: 4px; background: rgba(250,250,252,0.1); margin-top: 5px; overflow: hidden; }
.sw-bar-fill { height: 100%; background: var(--accent); transition: width 1.2s cubic-bezier(.2,.8,.2,1); }

.sw-projects-body { display: grid; grid-template-columns: 1fr 1.2fr; gap: 48px; align-items: center; flex: 1; }
.sw-tally { text-align: center; }
.sw-tally-number {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(120px, 22vw, 300px); line-height: 1; color: #FFFFFF; letter-spacing: 0.02em;
}
.sw-tally-sub { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(22px, 2.2vw, 32px); color: var(--light-sky); letter-spacing: 0.06em; }
.sw-delivery-list ul { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.sw-delivery-list li {
  display: flex; justify-content: space-between; align-items: baseline; gap: 20px;
  border-bottom: 1px solid rgba(250,250,252,0.12); padding-bottom: 12px;
}
.sw-delivery-name {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(22px, 2.2vw, 30px); letter-spacing: 0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sw-delivery-date { font-family: 'Overpass', sans-serif; font-weight: 600; font-size: 18px; color: var(--turquoise); flex-shrink: 0; }
.sw-empty { color: rgba(250,250,252,0.7); font-size: 20px; }

.sw-announce { max-width: 1100px; }
.sw-announce-head h2 {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(34px, 4vw, 56px); margin: 0 0 26px; line-height: 1;
  letter-spacing: 0.14em; text-transform: uppercase; color: #FFFFFF;
}
.sw-announce-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.sw-announce-list li {
  display: flex; justify-content: space-between; align-items: baseline; gap: 20px;
  background: rgba(250,250,252,0.05); border-left: 3px solid var(--sky);
  padding: 16px 20px; border-radius: 0 10px 10px 0;
}
.sw-announce-msg { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(17px, 1.9vw, 26px); letter-spacing: 0.02em; }
.sw-announce-date { font-family: 'Overpass', sans-serif; font-weight: 600; font-size: 14px; color: var(--light-sky); flex-shrink: 0; }
.sw-announce-fallback { display: flex; flex-direction: column; gap: 14px; }

.sw-photos { display: flex; align-items: center; justify-content: center; padding: 16px 36px; }
.sw-photo {
  max-width: 100%; max-height: calc(100vh - 190px);
  border-radius: 14px; box-shadow: 0 24px 70px rgba(20,4,60,0.5);
  object-fit: contain;
}

.sw-footer { display: flex; justify-content: center; padding: 10px 0 16px; position: relative; z-index: 2; }
.sw-dots { display: flex; gap: 10px; }
.sw-dot { width: 9px; height: 9px; border-radius: 50%; border: none; cursor: pointer; background: rgba(250,250,252,0.25); padding: 0; }
.sw-dot-on { background: var(--sky); }

.sw-celebration {
  position: fixed; inset: 0; z-index: 50;
  background: linear-gradient(100deg, #28066C 0%, #463282 100%);
  display: flex; align-items: center; justify-content: center;
  animation: sw-fadein 0.5s ease;
}
.sw-celebration-inner {
  position: relative; text-align: center; max-width: 940px; padding: 0 48px; z-index: 2;
  animation: sw-rise 0.7s cubic-bezier(.2,.9,.3,1.2);
}
.sw-celebration-icon { margin-bottom: 26px; }
.sw-icon-spin { animation: sw-spin 24s linear infinite; }
.sw-eyebrow {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 15px; letter-spacing: 0.34em; text-transform: uppercase;
  color: #6EC8F5; margin-bottom: 20px;
}
.sw-headline {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(54px, 8.5vw, 118px); margin: 0 0 24px; line-height: 1;
  letter-spacing: 0.12em; text-transform: uppercase; color: #FFFFFF;
}
.sw-dealname { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(20px, 2.6vw, 34px); margin: 0 0 18px; color: #9DD9F7; letter-spacing: 0.02em; }
.sw-amount { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(38px, 5vw, 66px); color: #FAB419; margin-bottom: 20px; letter-spacing: 0.04em; }
.sw-credit { font-family: 'Overpass', sans-serif; font-size: clamp(16px, 2vw, 24px); color: rgba(250,250,252,0.85); }
.sw-credit strong { color: #FFFFFF; font-weight: 800; }
.sw-delivery-msg { font-family: 'Barlow', sans-serif; font-weight: 300; font-size: clamp(22px, 3vw, 38px); line-height: 1.5; color: rgba(250,250,252,0.95); }
.sw-delivery-msg strong { color: #9DD9F7; font-weight: 400; }

@keyframes sw-fall {
  from { transform: translate(0, -6vh) rotate(0deg); opacity: 1; }
  to { transform: translate(var(--drift, 0px), 106vh) rotate(720deg); opacity: 0.85; }
}
@keyframes sw-fadein { from { opacity: 0; } }
@keyframes sw-rise { from { opacity: 0; transform: translateY(36px) scale(0.96); } }
@keyframes sw-spin { to { transform: rotate(360deg); } }


.sw-celebrant-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 28px; max-width: 1100px; }
.sw-celebrant-list li {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
  background: rgba(250,250,252,0.05); border-left: 3px solid var(--accent, #B91982);
  padding: 15px 20px; border-radius: 0 10px 10px 0;
}
.sw-celebrant-list li.sw-today { background: rgba(250,250,252,0.12); }
.sw-celebrant-name { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(17px, 1.9vw, 26px); letter-spacing: 0.02em; }
.sw-today-tag {
  font-style: normal; font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--accent, #B91982); margin-left: 12px;
}
.sw-celebrant-detail { font-family: 'Overpass', sans-serif; font-weight: 600; font-size: 14px; color: var(--light-sky); flex-shrink: 0; }
@media (max-width: 860px) { .sw-celebrant-list { grid-template-columns: 1fr; } }

/* Decorative confetti flecks (static — for This Month) */
.sw-flecks { position: absolute; inset: 0; pointer-events: none; }
.sw-flecks > span { position: absolute; border-radius: 1px; }

/* This Month at Smart */
.sw-thismonth { position: relative; padding: 26px 72px 30px; }
.sw-thismonth-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  grid-template-areas: "b a" "n n"; position: relative; z-index: 2;
}
.sw-tm-panel {
  background: rgba(250,250,252,0.05); border-top: 3px solid var(--accent, #6EC8F5);
  border-radius: 0 0 12px 12px; padding: 18px 22px 20px;
}
.sw-tm-panel-wide { grid-area: n; }
.sw-thismonth-grid > .sw-tm-panel:nth-child(1) { grid-area: b; }
.sw-thismonth-grid > .sw-tm-panel:nth-child(2) { grid-area: a; }
.sw-tm-panel-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.sw-tm-panel-head h3 {
  margin: 0; font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 18px; letter-spacing: 0.26em; text-transform: uppercase;
  color: var(--accent, #6EC8F5);
}
.sw-tm-panel ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.sw-tm-panel li {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
  padding: 10px 0; border-bottom: 1px solid rgba(250,250,252,0.08);
}
.sw-tm-panel li:last-child { border-bottom: none; }
.sw-tm-panel li.sw-today .sw-tm-name { color: #FFF; }
.sw-tm-name { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(22px, 2.2vw, 30px); letter-spacing: 0.02em; }
.sw-tm-msg { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(22px, 2.2vw, 30px); letter-spacing: 0.02em; }
.sw-tm-detail { font-family: 'Overpass', sans-serif; font-weight: 600; font-size: 18px; color: var(--light-sky); flex-shrink: 0; }
.sw-tm-empty { color: rgba(250,250,252,0.6); font-size: 18px; margin: 4px 0 0; }

/* Smart Zero funnel */
.sw-zero { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr; gap: 40px; align-items: center; }
.sw-zero-head { grid-column: 1 / -1; margin-bottom: 4px; }
.sw-zero-goal { text-align: center; }
.sw-zero-goal-number {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(70px, 10vw, 132px); line-height: 1;
  letter-spacing: 0.02em; color: #FAB419; margin: 10px 0 4px;
}
.sw-zero-goal-of {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(22px, 2.2vw, 30px); color: var(--light-sky); letter-spacing: 0.06em;
}
.sw-zero-goal-bar {
  height: 14px; background: rgba(250,250,252,0.1); border-radius: 8px;
  margin: 22px 40px 10px; overflow: hidden;
}
.sw-zero-goal-fill {
  height: 100%;
  background: linear-gradient(90deg, #FA7855, #FAB419);
  border-radius: 8px; transition: width 1.5s cubic-bezier(.2,.8,.2,1);
}
.sw-zero-goal-pct {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 16px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--sky);
}
.sw-zero-summary { display: flex; justify-content: center; gap: 48px; margin-top: 28px; }
.sw-zero-summary > div { display: flex; flex-direction: column; align-items: center; }
.sw-zero-summary-n {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(32px, 3vw, 48px); color: #FFFFFF; line-height: 1;
}
.sw-zero-summary-l {
  font-family: 'Overpass', sans-serif; font-weight: 600;
  font-size: 14px; letter-spacing: 0.22em; text-transform: uppercase;
  color: rgba(250,250,252,0.55); margin-top: 6px;
}
.sw-zero-funnel ul { list-style: none; margin: 16px 0 0; padding: 0; display: flex; flex-direction: column; gap: 18px; }
.sw-zero-stage-head {
  display: flex; justify-content: space-between; align-items: baseline; gap: 14px; margin-bottom: 8px;
}
.sw-zero-stage-name { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(22px, 2.2vw, 30px); letter-spacing: 0.02em; }
.sw-zero-stage-nums { font-family: 'Overpass', sans-serif; font-weight: 600; font-size: 18px; color: var(--light-sky); }
.sw-zero-bar { height: 12px; background: rgba(250,250,252,0.08); border-radius: 6px; overflow: hidden; }
.sw-zero-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6EC8F5, #FAB419);
  border-radius: 6px; transition: width 1.5s cubic-bezier(.2,.8,.2,1);
}

/* GP screen */
.sw-gp { display: flex; align-items: center; justify-content: center; }
.sw-gp-inner { text-align: center; max-width: 900px; padding: 0 32px; }
.sw-gp-number {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(120px, 20vw, 260px); line-height: 1;
  letter-spacing: 0.01em; margin: 14px 0 8px;
}
.sw-gp-on { color: #82E196; }
.sw-gp-off { color: #FAB419; }
.sw-gp-percent {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: 0.5em; margin-left: 6px; color: rgba(250,250,252,0.75);
}
.sw-gp-target {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(26px, 2.6vw, 38px); color: var(--light-sky);
  letter-spacing: 0.06em; margin-bottom: 12px;
}
.sw-gp-target strong { color: #FFFFFF; font-weight: 500; }
.sw-gp-gap {
  display: inline-block; margin-left: 20px;
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 18px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--sky);
}
.sw-gp-basis {
  font-family: 'Overpass', sans-serif; font-weight: 600;
  font-size: 18px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(250,250,252,0.55); margin-top: 18px;
}

/* Marketing screens */
.sw-mkt { display: flex; flex-direction: column; }
.sw-mkt-grid {
  flex: 1;
  display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr);
  gap: 20px 28px; padding-top: 8px;
}
.sw-mkt-card {
  background: rgba(250,250,252,0.05);
  border-top: 3px solid var(--sky);
  border-radius: 0 0 12px 12px;
  padding: 24px 28px 28px;
  display: flex; flex-direction: column; justify-content: center;
  min-height: 0;
}
.sw-mkt-card-soon { border-top-color: rgba(250,250,252,0.2); opacity: 0.55; }
.sw-mkt-label {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 16px; letter-spacing: 0.26em; text-transform: uppercase;
  color: var(--sky); margin-bottom: 8px;
}
.sw-mkt-card-soon .sw-mkt-label { color: rgba(250,250,252,0.5); }
.sw-mkt-value {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(58px, 7vw, 110px); line-height: 1;
  letter-spacing: 0.02em; color: #FFFFFF; margin-bottom: 8px;
}
.sw-mkt-card-soon .sw-mkt-value {
  font-size: clamp(26px, 2.6vw, 38px); color: rgba(250,250,252,0.6); text-transform: uppercase; letter-spacing: 0.06em;
}
.sw-mkt-trend {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 18px; letter-spacing: 0.22em; text-transform: uppercase;
}
.sw-mkt-up { color: #82E196; }
.sw-mkt-down { color: #FA7855; }

/* Marketing leads screen (goal + landing pages) */
.sw-mkt-leads { display: flex; flex-direction: column; }
.sw-mkt-goal { text-align: center; padding: 20px 40px 30px; }
.sw-mkt-goal-number {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(90px, 12vw, 180px); line-height: 1;
  letter-spacing: 0.02em; color: #FAB419; margin: 10px 0 4px;
}
.sw-mkt-goal-of {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(22px, 2.2vw, 30px); color: var(--light-sky); letter-spacing: 0.06em;
}
.sw-mkt-goal-bar {
  height: 14px; background: rgba(250,250,252,0.1); border-radius: 8px;
  margin: 20px 40px 10px; overflow: hidden;
}
.sw-mkt-goal-fill {
  height: 100%;
  background: linear-gradient(90deg, #FA7855, #FAB419);
  border-radius: 8px; transition: width 1.5s cubic-bezier(.2,.8,.2,1);
}
.sw-mkt-goal-pct {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 16px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--sky);
}
.sw-mkt-lp { padding-top: 8px; flex: 1; display: flex; flex-direction: column; }
.sw-mkt-lp-row {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  margin-top: 14px; flex: 1;
}
.sw-mkt-lp-row .sw-mkt-card { border-top-color: var(--turquoise); }
.sw-mkt-lp-row-single {
  grid-template-columns: minmax(0, 420px);
  justify-content: center;
}
.sw-mkt-lp-row-single .sw-mkt-value { font-size: clamp(48px, 5.5vw, 84px); }

@media (max-width: 860px) {
  .sw-zero { grid-template-columns: 1fr; }
  .sw-thismonth-grid { grid-template-columns: 1fr; grid-template-areas: "b" "a" "n"; }
  .sw-two-col, .sw-projects-body { grid-template-columns: 1fr; }
  .sw-mkt-grid { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
  .sw-mkt-lp-row { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .sw-icon-spin, .sw-bar-fill, .sw-screen, .sw-zero-goal-fill, .sw-zero-bar-fill { animation: none; transition: none; }
}


/* OKR dial screen (Team OKRs) */
.sw-okr { display: flex; flex-direction: column; }
.sw-okr-grid {
  flex: 1;
  display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 22px; align-content: center; padding-top: 6px;
}
.sw-okr-card {
  background: rgba(250,250,252,0.05);
  border-top: 3px solid var(--accent, #6EC8F5);
  border-radius: 0 0 14px 14px;
  padding: 22px 20px 26px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.sw-okr-dial-svg { width: 100%; max-width: 220px; height: auto; margin-bottom: 4px; }
.sw-okr-pct {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(38px, 3.6vw, 54px); line-height: 1; margin-top: -18px;
}
.sw-okr-name {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(18px, 1.6vw, 24px); letter-spacing: 0.03em;
  color: #FFFFFF; margin-top: 10px;
}
.sw-okr-badge {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
  margin-top: 6px;
}
.sw-okr-goals {
  font-family: 'Overpass', sans-serif; font-weight: 600;
  font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(250,250,252,0.5); margin-top: 4px;
}
`;
