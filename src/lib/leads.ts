import { promises as fs } from "node:fs";
import path from "node:path";

import { type LeadFieldConfig, getPriceRules } from "@/lib/config-store";

export type PrioridadLead = "caliente" | "templado" | "frío";
export type EstadoLead = "incompleto" | "pendiente_confirmacion" | "calificado" | "enviado_zapier";

export type LeadFicha = {
  nombre_empresa: string | null;
  telefono: string | null;
  email: string | null;
  tipo_contenedor: string | null;
  texto_original_tipo_contenedor: string | null;
  codigo_postal_entrega: string | null;
  ciudad_entrega: string | null;
  uso: string | null;
  urgencia: string | null;
  presupuesto_aproximado: number | null;
  prioridad_lead: PrioridadLead;
  estado_lead: EstadoLead;
  motivo_calificacion: string;
  precio_estimado: number | null;
  resumen_comercial: string;
  siguiente_accion: string;
  consentimiento_rgpd: "sí" | "no" | null;
  conversacion_completa?: string;
};

export const LEADS_FILE_PATH = path.join(process.cwd(), "data", "leads.json");

function normalizarTexto(texto: string) { return texto.toLowerCase().normalize("NFD").replaceAll(/\p{Diacritic}/gu, ""); }

export function interpretarTipoContenedor(textoOriginal: string): string | null {
  const texto = normalizarTexto(textoOriginal);
  if (/(nevera|frigorifico|reefer|refrigerado)/.test(texto)) return "Contenedor refrigerado";
  const es40 = /(\b40\b|40 pies|40ft|12 metros)/.test(texto);
  const es20 = /(\b20\b|20 pies|20ft|6 metros)/.test(texto);
  if (es40 && /(\bhc\b|high cube|alto cubo|\balto\b)/.test(texto)) return "Contenedor 40 pies High Cube";
  if (es40) return "Contenedor 40 pies estándar";
  if (es20) return "Contenedor 20 pies estándar";
  return null;
}

export async function calcularPrecio(tipoContenedor: string | null, codigoPostal: string | null) {
  const rules = (await getPriceRules()).filter((r) => r.active);
  const base = rules.find((r) => r.tipo_contenedor === tipoContenedor);
  if (!base) return { precio_contenedor: null, transporte: null, total: null };
  let transporte = base.precio_transporte;
  if (codigoPostal?.startsWith("07")) {
    const baleares = rules.find((r) => r.id === "baleares_cp07");
    if (baleares) transporte = baleares.precio_transporte;
  }
  return { precio_contenedor: base.precio_contenedor, transporte, total: base.precio_contenedor + transporte };
}

export function calificarLead(lead: LeadFicha): { prioridad_lead: PrioridadLead; estado_lead: EstadoLead; motivo_calificacion: string } {
  if (lead.consentimiento_rgpd !== "sí") return { prioridad_lead: "frío", estado_lead: "incompleto", motivo_calificacion: "Sin consentimiento RGPD" };
  const hasContacto = Boolean(lead.nombre_empresa && (lead.telefono || lead.email));
  const hasNecesidad = Boolean(lead.tipo_contenedor && (lead.ciudad_entrega || lead.codigo_postal_entrega));
  const hasUrgencia = Boolean(lead.urgencia);
  if (hasContacto && hasNecesidad && hasUrgencia) return { prioridad_lead: "caliente", estado_lead: "calificado", motivo_calificacion: "Datos clave completos y urgencia indicada" };
  if (hasContacto && hasNecesidad) return { prioridad_lead: "templado", estado_lead: "pendiente_confirmacion", motivo_calificacion: "Datos principales presentes, faltan secundarios" };
  return { prioridad_lead: "frío", estado_lead: "incompleto", motivo_calificacion: "Faltan datos básicos" };
}

export async function extraerFichaLead(parsed: Partial<LeadFicha>) {
  const tipo = interpretarTipoContenedor(parsed.texto_original_tipo_contenedor ?? parsed.tipo_contenedor ?? "");
  const precio = await calcularPrecio(tipo, parsed.codigo_postal_entrega ?? null);
  const base: LeadFicha = { nombre_empresa: parsed.nombre_empresa ?? null, telefono: parsed.telefono ?? null, email: parsed.email ?? null, tipo_contenedor: tipo, texto_original_tipo_contenedor: parsed.texto_original_tipo_contenedor ?? null, codigo_postal_entrega: parsed.codigo_postal_entrega ?? null, ciudad_entrega: parsed.ciudad_entrega ?? null, uso: parsed.uso ?? null, urgencia: parsed.urgencia ?? null, presupuesto_aproximado: parsed.presupuesto_aproximado ?? null, prioridad_lead: "frío", estado_lead: "incompleto", motivo_calificacion: "Pendiente", precio_estimado: precio.total, resumen_comercial: parsed.resumen_comercial ?? "Pendiente", siguiente_accion: parsed.siguiente_accion ?? "Solicitar confirmación", consentimiento_rgpd: parsed.consentimiento_rgpd === "sí" ? "sí" : parsed.consentimiento_rgpd === "no" ? "no" : null, conversacion_completa: parsed.conversacion_completa };
  const calificacion = calificarLead(base);
  return { ...base, ...calificacion };
}

export function getMissingRequiredFields(lead: LeadFicha, fields: LeadFieldConfig[]) {
  return fields.filter((f) => f.active && f.required).map((f) => f.key).filter((key) => {
    const value = lead[key as keyof LeadFicha];
    if (key === "consentimiento_rgpd") return value !== "sí";
    return value === null || value === "";
  });
}

export async function guardarLeadDemo(lead: LeadFicha) {
  await fs.mkdir(path.dirname(LEADS_FILE_PATH), { recursive: true });
  let leads: LeadFicha[] = [];
  try { leads = JSON.parse(await fs.readFile(LEADS_FILE_PATH, "utf-8")) as LeadFicha[]; } catch {}
  leads.push(lead);
  await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(leads, null, 2), "utf-8");
}

export async function enviarLeadAZapier(lead: LeadFicha) {
  const webhook = process.env.ZAPIER_LEAD_WEBHOOK_URL;
  if (!webhook) throw new Error("Webhook no configurado");
  const payload = { fecha_creacion: new Date().toISOString(), origen_lead: "chatbot_web", ...lead };
  const res = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error("Error al enviar lead a Zapier");
  return { ok: true };
}

export async function crearLeadOdoo(_lead: LeadFicha) { return { status: "pendiente" as const }; }
