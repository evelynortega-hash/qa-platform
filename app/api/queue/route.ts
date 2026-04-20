import { NextRequest, NextResponse } from "next/server";

const mem: Record<string, string> = {};
async function kvGet(k: string) { try { const {kv}=await import("@vercel/kv"); return await kv.get<string>(k); } catch { return mem[k]??null; } }
async function kvSet(k: string, v: string) { try { const {kv}=await import("@vercel/kv"); await kv.set(k,v); } catch { mem[k]=v; } }

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
