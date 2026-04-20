import { NextRequest, NextResponse } from "next/server";

const mem: Record<string, string> = {};
async function kvGet(k: string) { try { const {kv}=await import("@vercel/kv"); return await kv.get<string>(k); } catch { return mem[k]??null; } }
async function kvSet(k: string, v: string) { try { const {kv}=await import("@vercel/kv"); await kv.set(k,v); } catch { mem[k]=v; } }
async function kvDel(k: string) { try { const {kv}=await import("@vercel/kv"); await kv.del(k); } catch { delete mem[k]; } }

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
