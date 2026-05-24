import { NextResponse } from "next/server";
import { getBotSettings, getLeadFields, saveBotSettings, saveLeadFields } from "@/lib/config-store";

export async function GET() { return NextResponse.json({ settings: await getBotSettings(), fields: await getLeadFields() }); }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    await saveBotSettings(body.settings);
    await saveLeadFields(body.fields);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "No se pudo guardar configuración" }, { status: 400 }); }
}
