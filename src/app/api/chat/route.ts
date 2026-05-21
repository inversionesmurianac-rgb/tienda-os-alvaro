import { NextResponse } from "next/server";

import { getBotSettings, getLeadFields } from "@/lib/config-store";
import { extraerFichaLead, getMissingRequiredFields } from "@/lib/leads";

type Message = { role: "user" | "assistant"; content: string };

async function extraerConIA(mensajes: Message[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada");
  const settings = await getBotSettings();
  const prompt = `${settings.generalInstructions}\n${settings.extractionInstructions}\nDevuelve JSON válido con: nombre_empresa, telefono, email, texto_original_tipo_contenedor, codigo_postal_entrega, ciudad_entrega, uso, urgencia, presupuesto_aproximado, resumen_comercial, siguiente_accion, consentimiento_rgpd.`;
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: "gpt-4.1-mini", input: [{ role: "system", content: prompt }, { role: "user", content: mensajes.map((m) => `${m.role}: ${m.content}`).join("\n") }], text: { format: { type: "json_object" } } }) });
  if (!response.ok) throw new Error("Error externo de IA");
  const data = await response.json();
  return JSON.parse(data.output_text as string);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages: Message[] };
    const lead = await extraerFichaLead({ ...(await extraerConIA(body.messages ?? [])), conversacion_completa: JSON.stringify(body.messages ?? []) });
    const fields = await getLeadFields();
    const faltantes = getMissingRequiredFields(lead, fields);
    const readyForConfirmation = faltantes.length === 0;
    const assistantMessage = readyForConfirmation
      ? `Perfecto. Tu ficha está lista para revisión final. Precio estimado: ${lead.precio_estimado ?? "pendiente"} € (orientativo).`
      : `Voy completando tu solicitud. Me falta: ${faltantes.join(", ")}.`;
    return NextResponse.json({ lead, assistantMessage, readyForConfirmation, faltantes });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar el chat" }, { status: 500 });
  }
}
