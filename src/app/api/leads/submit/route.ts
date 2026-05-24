import { NextResponse } from "next/server";

import { getLeadFields } from "@/lib/config-store";
import { calificarLead, enviarLeadAZapier, extraerFichaLead, getMissingRequiredFields, guardarLeadDemo } from "@/lib/leads";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const lead = await extraerFichaLead(input);
    const fields = await getLeadFields();
    const faltantes = getMissingRequiredFields(lead, fields);
    if (faltantes.length) return NextResponse.json({ error: `Faltan campos obligatorios: ${faltantes.join(", ")}` }, { status: 400 });
    if (lead.consentimiento_rgpd !== "sí") return NextResponse.json({ error: "Debes aceptar la política de privacidad para enviar la solicitud." }, { status: 400 });
    const calificado = { ...lead, ...calificarLead(lead), estado_lead: "enviado_zapier" as const };
    await enviarLeadAZapier(calificado);
    await guardarLeadDemo(calificado);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se ha podido enviar la solicitud en este momento." }, { status: 500 });
  }
}
