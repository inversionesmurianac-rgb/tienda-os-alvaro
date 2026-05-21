import { NextResponse } from "next/server";

import { extraerFichaLead } from "@/lib/leads";

type Message = { role: "user" | "assistant"; content: string };

async function extraerConIA(mensajes: Message[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada");
  }

  const prompt = `Eres un extractor de datos comerciales. Devuelve solo JSON válido con estas claves:
nombre, teléfono, email, texto_original_tipo_contenedor, codigo_postal_entrega, ciudad_entrega, uso, urgencia, presupuesto_aproximado, resumen_comercial, siguiente_accion, consentimiento_rgpd.
Reglas: no inventes datos; si falta un dato usa null. consentimiento_rgpd solo "sí" o "no".`;

  const userText = mensajes.map((m) => `${m.role}: ${m.content}`).join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: prompt },
        { role: "user", content: userText },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  if (!response.ok) {
    throw new Error(`Error OpenAI: ${response.status}`);
  }

  const data = await response.json();
  const text = data.output_text as string;
  return JSON.parse(text);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages: Message[] };
    const mensajes = body.messages ?? [];

    const extraido = await extraerConIA(mensajes);
    const lead = extraerFichaLead(extraido);

    const faltantes = ["nombre", "teléfono", "email", "tipo_contenedor", "ciudad_entrega", "consentimiento_rgpd"]
      .filter((k) => !lead[k as keyof typeof lead]);

    const textoPrecio = lead.precio_estimado
      ? `Precio estimado: ${lead.precio_estimado} € (orientativo, sujeto a disponibilidad y transporte final).`
      : "Necesito concretar tipo de contenedor y zona de entrega para calcular precio.";

    const assistantMessage = faltantes.length
      ? `Perfecto, voy avanzando tu solicitud. ${textoPrecio} Para completar la ficha me falta: ${faltantes.join(", ")}.`
      : `¡Gracias! ${textoPrecio} Un comercial de Origen Contenedores validará disponibilidad y transporte contigo.`;

    return NextResponse.json({ lead, assistantMessage, readyToSave: faltantes.length === 0 });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo procesar el chat", detail: (error as Error).message },
      { status: 500 },
    );
  }
}
