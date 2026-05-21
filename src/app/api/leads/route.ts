import { NextResponse } from "next/server";

import { crearLeadOdoo, extraerFichaLead, guardarLead } from "@/lib/leads";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const lead = extraerFichaLead(input);

    if (lead.consentimiento_rgpd !== "sí") {
      return NextResponse.json({ error: "Falta consentimiento RGPD" }, { status: 400 });
    }

    const saved = await guardarLead(lead);
    await crearLeadOdoo(saved);

    return NextResponse.json({ ok: true, lead: saved });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo guardar el lead", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
