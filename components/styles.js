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
