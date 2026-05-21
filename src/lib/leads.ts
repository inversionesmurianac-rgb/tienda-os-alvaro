import { promises as fs } from "node:fs";
import path from "node:path";

export type PrioridadLead = "caliente" | "templado" | "frío";

export type LeadFicha = {
  nombre: string | null;
  teléfono: string | null;
  email: string | null;
  tipo_contenedor: string | null;
  texto_original_tipo_contenedor: string | null;
  codigo_postal_entrega: string | null;
  ciudad_entrega: string | null;
  uso: string | null;
  urgencia: string | null;
  presupuesto_aproximado: number | null;
  prioridad_lead: PrioridadLead;
  precio_estimado: number | null;
  resumen_comercial: string;
  siguiente_accion: string;
  consentimiento_rgpd: "sí" | "no";
};

export const LEADS_FILE_PATH = path.join(process.cwd(), "data", "leads.json");

function normalizarTexto(texto: string) {
  return texto.toLowerCase().normalize("NFD").replaceAll(/\p{Diacritic}/gu, "");
}

export function interpretarTipoContenedor(textoOriginal: string): string | null {
  const texto = normalizarTexto(textoOriginal);
  const esReefer = /(nevera|frigorifico|reefer|refrigerado)/.test(texto);
  if (esReefer) return "Contenedor refrigerado";

  const es40 = /(\b40\b|40 pies|40ft|12 metros)/.test(texto);
  const es20 = /(\b20\b|20 pies|20ft|6 metros)/.test(texto);
  const esHC = /(\bhc\b|high cube|alto cubo|\balto\b)/.test(texto);

  if (es40 && esHC) return "Contenedor 40 pies High Cube";
  if (es40) return "Contenedor 40 pies estándar";
  if (es20) return "Contenedor 20 pies estándar";

  return null;
}

export function calcularPrecio(tipoContenedor: string | null, codigoPostal: string | null) {
  const mapaPrecio: Record<string, number> = {
    "Contenedor 20 pies estándar": 1800,
    "Contenedor 40 pies estándar": 2500,
    "Contenedor 40 pies High Cube": 2700,
    "Contenedor refrigerado": 6000,
  };

  const precioContenedor = tipoContenedor ? mapaPrecio[tipoContenedor] : undefined;
  if (!precioContenedor) {
    return { precio_contenedor: null, transporte: null, total: null };
  }

  const transporte = codigoPostal?.startsWith("07") ? 1500 : 450;
  return {
    precio_contenedor: precioContenedor,
    transporte,
    total: precioContenedor + transporte,
  };
}

function calcularPrioridad(lead: LeadFicha): PrioridadLead {
  if (lead.urgencia?.toLowerCase().includes("este mes") || lead.urgencia?.toLowerCase().includes("urgente")) {
    return "caliente";
  }
  if (lead.presupuesto_aproximado || lead.uso) {
    return "templado";
  }
  return "frío";
}

export function extraerFichaLead(parsed: Partial<LeadFicha>): LeadFicha {
  const tipoNormalizado = interpretarTipoContenedor(parsed.texto_original_tipo_contenedor ?? "");
  const precio = calcularPrecio(tipoNormalizado, parsed.codigo_postal_entrega ?? null);

  const base: LeadFicha = {
    nombre: parsed.nombre ?? null,
    teléfono: parsed.teléfono ?? null,
    email: parsed.email ?? null,
    tipo_contenedor: tipoNormalizado,
    texto_original_tipo_contenedor: parsed.texto_original_tipo_contenedor ?? null,
    codigo_postal_entrega: parsed.codigo_postal_entrega ?? null,
    ciudad_entrega: parsed.ciudad_entrega ?? null,
    uso: parsed.uso ?? null,
    urgencia: parsed.urgencia ?? null,
    presupuesto_aproximado: parsed.presupuesto_aproximado ?? null,
    prioridad_lead: "frío",
    precio_estimado: precio.total,
    resumen_comercial: parsed.resumen_comercial ?? "Pendiente de completar datos comerciales.",
    siguiente_accion: parsed.siguiente_accion ?? "Solicitar confirmación de disponibilidad y transporte.",
    consentimiento_rgpd: parsed.consentimiento_rgpd === "sí" ? "sí" : "no",
  };

  base.prioridad_lead = calcularPrioridad(base);
  return base;
}

export async function guardarLead(lead: LeadFicha) {
  await fs.mkdir(path.dirname(LEADS_FILE_PATH), { recursive: true });
  let leads: LeadFicha[] = [];

  try {
    const raw = await fs.readFile(LEADS_FILE_PATH, "utf-8");
    leads = JSON.parse(raw) as LeadFicha[];
  } catch {
    leads = [];
  }

  leads.push(lead);
  await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(leads, null, 2), "utf-8");
  return lead;
}

export async function crearLeadOdoo(_lead: LeadFicha) {
  // Placeholder para integración futura con Odoo CRM.
  return { status: "pendiente" as const };
}
