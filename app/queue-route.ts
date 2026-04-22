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
  const raw = await kvGet("qa_queue");
  return NextResponse.json(raw ? JSON.parse(raw) : []);
}

export async function POST(req: NextRequest) {
  const item = await req.json();
  const raw = await kvGet("qa_queue");
  const queue = raw ? JSON.parse(raw) : [];
  if (!queue.find((q: any) => q.id === item.id)) queue.push(item);
  await kvSet("qa_queue", JSON.stringify(queue));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const raw = await kvGet("qa_queue");
  const queue = (raw ? JSON.parse(raw) : []).filter((q: any) => q.id !== id);
  await kvSet("qa_queue", JSON.stringify(queue));
  return NextResponse.json({ ok: true });
}
