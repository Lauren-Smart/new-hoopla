"use client";

import { useState, useEffect, useCallback } from "react";

// Simple team admin page: shared password, photo uploads, announcements.
// Lives at /admin — the TV never shows this.
export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [photos, setPhotos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [p, a] = await Promise.all([
      fetch("/api/admin/photos").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/announcements").then((r) => (r.ok ? r.json() : null)),
    ]);
    if (p && a) {
      setAuthed(true);
      setPhotos(p.photos || []);
      setAnnouncements(a.announcements || []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) load();
    else setError("Wrong password");
  }

  async function upload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    const form = new FormData();
    for (const f of files) form.append("files", f);
    await fetch("/api/admin/photos", { method: "POST", body: form });
    e.target.value = "";
    await load();
    setBusy(false);
  }

  async function removePhoto(url) {
    await fetch("/api/admin/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    load();
  }

  async function addAnnouncement(e) {
    e.preventDefault();
    if (!message.trim()) return;
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    setMessage("");
    load();
  }

  async function removeAnnouncement(id) {
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const S = styles;
  if (!authed) {
    return (
      <div style={S.page}>
        <form onSubmit={login} style={S.card}>
          <h1 style={S.h1}>Wins Board Admin</h1>
          <input type="password" placeholder="Team password" value={password}
            onChange={(e) => setPassword(e.target.value)} style={S.input} />
          {error && <p style={{ color: "#FA7855", margin: 0, fontSize: 14 }}>{error}</p>}
          <button style={S.btn}>Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 760 }}>
        <h1 style={S.h1}>Wins Board Admin</h1>

        <h2 style={S.h2}>Photos on the TV</h2>
        <label style={S.uploadBox}>
          {busy ? "Uploading…" : "Tap or drop photos here to add them to the rotation"}
          <input type="file" accept="image/*" multiple onChange={upload} style={{ display: "none" }} disabled={busy} />
        </label>
        <div style={S.grid}>
          {photos.map((p) => (
            <div key={p.url} style={S.thumbWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" style={S.thumb} />
              <button onClick={() => removePhoto(p.url)} style={S.thumbDel}>✕</button>
            </div>
          ))}
          {!photos.length && <p style={S.muted}>No photos yet.</p>}
        </div>

        <h2 style={S.h2}>Announcements</h2>
        <form onSubmit={addAnnouncement} style={{ display: "flex", gap: 8 }}>
          <input placeholder="e.g. Welcome to our new apprentice starting Monday!"
            value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...S.input, flex: 1 }} />
          <button style={S.btn}>Post</button>
        </form>
        <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {announcements.map((a) => (
            <li key={a.id} style={S.annRow}>
              <span>{a.message}</span>
              <button onClick={() => removeAnnouncement(a.id)} style={S.annDel}>Remove</button>
            </li>
          ))}
          {!announcements.length && <p style={S.muted}>No announcements posted.</p>}
        </ul>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center",
    background: "linear-gradient(100deg, #28066C 0%, #463282 100%)",
    fontFamily: "'Overpass', system-ui, sans-serif", padding: "40px 16px", color: "#FAFAFC",
  },
  card: {
    background: "rgba(250,250,252,0.06)", border: "1px solid rgba(250,250,252,0.16)",
    borderRadius: 16, padding: 28, width: "100%", maxWidth: 420,
    display: "flex", flexDirection: "column", gap: 14,
  },
  h1: { fontFamily: "'Barlow', sans-serif", fontWeight: 300, letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 24, margin: 0 },
  h2: { fontFamily: "'Overpass', sans-serif", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", fontSize: 12, color: "#6EC8F5", margin: "18px 0 4px" },
  input: {
    background: "rgba(250,250,252,0.08)", border: "1px solid rgba(250,250,252,0.22)",
    borderRadius: 8, padding: "11px 12px", color: "#FAFAFC", fontSize: 15,
  },
  btn: {
    background: "#FAB419", color: "#28066C", border: "none", borderRadius: 8,
    padding: "11px 18px", fontWeight: 800, cursor: "pointer",
    textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12,
  },
  uploadBox: {
    border: "2px dashed rgba(110,200,245,0.5)", borderRadius: 12, padding: "26px 16px",
    textAlign: "center", cursor: "pointer", color: "#9DD9F7", fontSize: 14, display: "block",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginTop: 12 },
  thumbWrap: { position: "relative" },
  thumb: { width: "100%", height: 90, objectFit: "cover", borderRadius: 8 },
  thumbDel: {
    position: "absolute", top: 4, right: 4, background: "rgba(40,6,108,0.85)", color: "#FAFAFC",
    border: "none", borderRadius: 6, width: 24, height: 24, cursor: "pointer",
  },
  annRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
    background: "rgba(250,250,252,0.05)", borderLeft: "3px solid #6EC8F5",
    padding: "10px 14px", borderRadius: "0 8px 8px 0", fontSize: 15,
  },
  annDel: { background: "none", border: "1px solid rgba(250,250,252,0.3)", color: "rgba(250,250,252,0.7)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 },
  muted: { color: "rgba(250,250,252,0.5)", fontSize: 14 },
};
