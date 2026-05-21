import { NextResponse } from "next/server";
import { getPriceRules, savePriceRules } from "@/lib/config-store";

export async function GET() { return NextResponse.json({ rules: await getPriceRules() }); }
export async function POST(request: Request) {
  try { const body = await request.json(); await savePriceRules(body.rules); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "No se pudo guardar pricing" }, { status: 400 }); }
}
