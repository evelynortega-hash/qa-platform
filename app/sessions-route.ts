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
  const raw = await kvGet("qa_sessions");
  return NextResponse.json(raw ? JSON.parse(raw) : {});
}

export async function POST(req: NextRequest) {
  const { itemId, snapshot } = await req.json();
  const raw = await kvGet("qa_sessions");
  const sessions = raw ? JSON.parse(raw) : {};
  sessions[itemId] = snapshot;
  await kvSet("qa_sessions", JSON.stringify(sessions));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { itemId } = await req.json();
  const raw = await kvGet("qa_sessions");
  const sessions = raw ? JSON.parse(raw) : {};
  delete sessions[itemId];
  await kvSet("qa_sessions", JSON.stringify(sessions));
  return NextResponse.json({ ok: true });
}
