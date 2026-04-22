import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}

async function get(key: string): Promise<string | null> {
  const { data, error } = await db()
    .from("qa_store")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) console.error("GET error:", key, error.message);
  return data?.value ?? null;
}

async function set(key: string, value: string) {
  const { error } = await db()
    .from("qa_store")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) console.error("SET error:", key, error.message);
}

export async function GET() {
  try {
    const idx = await get("qa_index");
    const ids: string[] = idx ? JSON.parse(idx) : [];
    if (!ids.length) return NextResponse.json([]);
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await get("qa_entry_" + id);
          return r ? JSON.parse(r) : null;
        } catch { return null; }
      })
    );
    return NextResponse.json(entries.filter(Boolean));
  } catch (e: any) {
    console.error("GET /api/log error:", e.message);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    if (!entry?.id) return NextResponse.json({ error: "Missing entry id" }, { status: 400 });

    // Save entry individually
    await set("qa_entry_" + entry.id, JSON.stringify(entry));

    // Read current index, prepend new id, save back
    const idx = await get("qa_index");
    const ids: string[] = idx ? JSON.parse(idx) : [];
    const newIds = [entry.id, ...ids.filter((i: string) => i !== entry.id)];
    await set("qa_index", JSON.stringify(newIds));

    return NextResponse.json({ ok: true, total: newIds.length });
  } catch (e: any) {
    console.error("POST /api/log error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
