import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Usa /api/leads/submit para enviar leads." }, { status: 410 });
}
