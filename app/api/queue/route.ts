import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
}
async function get(key: string): Promise<string | null> {
  const { data } = await db().from("qa_store").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}
async function set(key: string, value: string) {
  await db().from("qa_store").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

export async function GET() {
  const raw = await get("qa_queue");
  return NextResponse.json(raw ? JSON.parse(raw) : []);
}
export async function POST(req: NextRequest) {
  const item = await req.json();
  const raw = await get("qa_queue");
  const queue = raw ? JSON.parse(raw) : [];
  if (!queue.find((q: any) => q.id === item.id)) queue.push(item);
  await set("qa_queue", JSON.stringify(queue));
  return NextResponse.json({ ok: true });
}
export async function PUT(req: NextRequest) {
  const item = await req.json();
  if (!item?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const raw = await get("qa_queue");
  const queue: any[] = raw ? JSON.parse(raw) : [];
  const idx = queue.findIndex((q: any) => q.id === item.id);
  if (idx >= 0) queue[idx] = { ...queue[idx], ...item };
  else queue.push(item);
  await set("qa_queue", JSON.stringify(queue));
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const raw = await get("qa_queue");
  const queue = (raw ? JSON.parse(raw) : []).filter((q: any) => q.id !== id);
  await set("qa_queue", JSON.stringify(queue));
  return NextResponse.json({ ok: true });
}
