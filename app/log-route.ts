import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
}

async function kvGet(key: string): Promise<string | null> {
  const { data } = await getClient()
    .from("qa_store")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

async function kvSet(key: string, value: string) {
  await getClient()
    .from("qa_store")
    .upsert({ key, value, updated_at: new Date().toISOString() });
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
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    await kvSet("qa_entry_" + entry.id, JSON.stringify(entry));
    const idx = await kvGet("qa_index");
    const ids: string[] = idx ? JSON.parse(idx) : [];
    await kvSet("qa_index", JSON.stringify([entry.id, ...ids]));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
