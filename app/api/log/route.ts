import { NextRequest, NextResponse } from "next/server";

// KV helpers with in-memory fallback for dev
const mem: Record<string, string> = {};

async function kvGet(key: string): Promise<string | null> {
  try {
    const { kv } = await import("@vercel/kv");
    return await kv.get<string>(key);
  } catch {
    return mem[key] ?? null;
  }
}
async function kvSet(key: string, value: string) {
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value);
  } catch {
    mem[key] = value;
  }
}

export async function GET() {
  try {
    const idx = await kvGet("qa_index");
    const ids: string[] = idx ? JSON.parse(idx) : [];
    if (ids.length === 0) return NextResponse.json([]);
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const raw = await kvGet("qa_entry_" + id);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      })
    );
    return NextResponse.json(entries.filter(Boolean));
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    // Save entry individually
    await kvSet("qa_entry_" + entry.id, JSON.stringify(entry));
    // Update index
    const idx = await kvGet("qa_index");
    const ids: string[] = idx ? JSON.parse(idx) : [];
    await kvSet("qa_index", JSON.stringify([entry.id, ...ids]));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
