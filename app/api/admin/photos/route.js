import { NextResponse } from "next/server";
import { put, del, list } from "@vercel/blob";
import { isAdmin } from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const blobs = await list({ prefix: "photos/" });
  return NextResponse.json({
    ok: true,
    photos: blobs.blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((b) => ({ url: b.url, pathname: b.pathname })),
  });
}

export async function POST(request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const form = await request.formData();
  const files = form.getAll("files");
  const uploaded = [];
  for (const file of files) {
    if (!file || typeof file === "string") continue;
    if (!/^image\//.test(file.type)) continue;
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`photos/${Date.now()}-${safe}`, file, { access: "public" });
    uploaded.push(blob.url);
  }
  return NextResponse.json({ ok: true, uploaded });
}

export async function DELETE(request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const { url } = await request.json().catch(() => ({}));
  if (!url) return NextResponse.json({ ok: false }, { status: 400 });
  await del(url);
  return NextResponse.json({ ok: true });
}
