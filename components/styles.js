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
  padding: 22px 36px 14px; border-bottom: 1px solid rgba(250,250,252,0.14);
  position: relative; z-index: 2;
}
.sw-brand { display: flex; align-items: center; gap: 16px; }
.sw-logo-word {
  display: block; font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: 21px; letter-spacing: 0.22em; line-height: 1.15;
  text-transform: uppercase; color: #FFFFFF;
}
.sw-logo-tag {
  display: block; font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase;
  color: var(--sky); margin-top: 4px;
}
.sw-header-right { display: flex; align-items: center; gap: 18px; }
.sw-status { font-size: 12px; color: rgba(250,250,252,0.55); }
.sw-clock { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: 19px; letter-spacing: 0.12em; }

.sw-screen { flex: 1; display: flex; flex-direction: column; animation: sw-screenin 0.7s ease; position: relative; z-index: 2; }
@keyframes sw-screenin { from { opacity: 0; transform: translateX(28px); } }

.sw-main { flex: 1; padding: 26px 36px 10px; align-content: start; }
.sw-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }

.sw-board { min-width: 0; }
.sw-board-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding-bottom: 12px; margin-bottom: 14px; border-bottom: 2px solid var(--accent);
}
.sw-board-eyebrow {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 11px; letter-spacing: 0.26em; text-transform: uppercase;
  color: var(--sky); margin-bottom: 6px;
}
.sw-board-head h2 {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(26px, 2.8vw, 42px); margin: 0; line-height: 1;
  letter-spacing: 0.14em; text-transform: uppercase; color: #FFFFFF;
}
.sw-board-total { text-align: right; }
.sw-board-total span {
  font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(20px, 2vw, 32px);
  display: block; line-height: 1; letter-spacing: 0.04em; color: var(--accent);
}
.sw-board-total small {
  font-family: 'Overpass', sans-serif; font-weight: 800;
  font-size: 10px; letter-spacing: 0.26em; color: rgba(250,250,252,0.5);
}
.sw-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
.sw-row { display: flex; gap: 14px; align-items: center; }
.sw-rank {
  font-family: 'Overpass', sans-serif; font-weight: 800; font-size: 15px;
  width: 34px; height: 34px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(250,250,252,0.25); color: rgba(250,250,252,0.6);
  flex-shrink: 0; padding-top: 2px;
}
.sw-rank-top { background: var(--accent); color: var(--indigo); border-color: var(--accent); }
.sw-row-body { flex: 1; min-width: 0; }
.sw-row-line { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.sw-name {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(15px, 1.5vw, 20px); letter-spacing: 0.03em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sw-val { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(14px, 1.4vw, 19px); white-space: nowrap; letter-spacing: 0.03em; }
.sw-val em { font-style: normal; font-family: 'Overpass', sans-serif; font-weight: 400; font-size: 0.7em; color: rgba(250,250,252,0.55); }
.sw-bar { height: 5px; background: rgba(250,250,252,0.1); margin-top: 6px; overflow: hidden; }
.sw-bar-fill { height: 100%; background: var(--accent); transition: width 1.2s cubic-bezier(.2,.8,.2,1); }

.sw-projects { display: grid; grid-template-columns: 1fr 1.2fr; gap: 48px; align-items: center; }
.sw-tally { text-align: center; }
.sw-tally-number {
  font-family: 'Barlow', sans-serif; font-weight: 300;
  font-size: clamp(120px, 22vw, 300px); line-height: 1; color: #FFFFFF; letter-spacing: 0.02em;
}
.sw-tally-sub { font-family: 'Barlow', sans-serif; font-weight: 400; font-size: clamp(16px, 1.8vw, 24px); color: var(--light-sky); letter-spacing: 0.06em; }
.sw-delivery-list ul { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 13px; }
.sw-delivery-list li {
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
  border-bottom: 1px solid rgba(250,250,252,0.12); padding-bottom: 10px;
}
.sw-delivery-name {
  font-family: 'Barlow', sans-serif; font-weight: 400;
  font-size: clamp(16px, 1.7vw, 23px); letter-spacing: 0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.sw-delivery-date { font-family: 'Overpass', sans-serif; font-weight: 600; font-size: 14px; color: var(--turquoise); flex-shrink: 0; }
.sw-empty { color: rgba(250,250,252,0.6); font-size: 15px; }

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

@media (prefers-reduced-motion: reduce) {
  .sw-icon-spin, .sw-bar-fill, .sw-screen { animation: none; transition: none; }
}
@media (max-width: 860px) {
  .sw-two-col, .sw-projects { grid-template-columns: 1fr; }
}
`;
