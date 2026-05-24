import { promises as fs } from "node:fs";
import path from "node:path";

export type LeadFieldType = "text" | "email" | "phone" | "number" | "select" | "checkbox";

export type LeadFieldConfig = {
  key: string;
  label: string;
  type: LeadFieldType;
  required: boolean;
  active: boolean;
  order: number;
};

export type BotSettings = {
  assistantName: string;
  initialMessage: string;
  generalInstructions: string;
  extractionInstructions: string;
  qualificationRules: string;
  finalFormTitle: string;
  finalFormDescription: string;
  conversationRules: string;
};

export type PriceRule = {
  id: string;
  tipo_contenedor: string;
  estado?: string;
  origen?: string;
  provincia_destino?: string;
  codigo_postal_desde?: string;
  codigo_postal_hasta?: string;
  precio_contenedor: number;
  precio_transporte: number;
  radio_km_incluido?: number;
  precio_km_extra?: number;
  active: boolean;
  observaciones?: string;
};

const CONFIG_DIR = path.join(process.cwd(), "data");
const BOT_SETTINGS_FILE = path.join(CONFIG_DIR, "bot-settings.json");
const LEAD_FIELDS_FILE = path.join(CONFIG_DIR, "lead-fields.json");
const PRICING_FILE = path.join(CONFIG_DIR, "pricing-rules.json");

const defaultBotSettings: BotSettings = {
  assistantName: "Asistente comercial",
  initialMessage: "Hola, soy el asistente comercial de Origen Contenedores. ¿Qué tipo de contenedor necesitas y dónde lo entregamos?",
  generalInstructions: "Actúa como comercial consultivo. No inventes datos.",
  extractionInstructions: "Extrae solo campos del lead. Si faltan datos usa null.",
  qualificationRules: "Clasifica lead en caliente, templado o frío según completitud y urgencia.",
  finalFormTitle: "Confirma tu solicitud",
  finalFormDescription: "Revisa tus datos antes de enviar la solicitud.",
  conversationRules: "Pide datos paso a paso y solicita consentimiento RGPD antes del envío.",
};

const defaultLeadFields: LeadFieldConfig[] = [
  { key: "nombre_empresa", label: "Nombre o empresa", type: "text", required: true, active: true, order: 1 },
  { key: "email", label: "Email", type: "email", required: true, active: true, order: 2 },
  { key: "telefono", label: "Teléfono", type: "phone", required: true, active: true, order: 3 },
  { key: "tipo_contenedor", label: "Tipo de contenedor", type: "text", required: true, active: true, order: 4 },
  { key: "codigo_postal_entrega", label: "Código postal entrega", type: "text", required: true, active: true, order: 5 },
  { key: "ciudad_entrega", label: "Ciudad entrega", type: "text", required: true, active: true, order: 6 },
  { key: "uso", label: "Uso previsto", type: "text", required: false, active: true, order: 7 },
  { key: "urgencia", label: "Urgencia", type: "text", required: true, active: true, order: 8 },
  { key: "presupuesto_aproximado", label: "Presupuesto aproximado", type: "number", required: false, active: true, order: 9 },
  { key: "consentimiento_rgpd", label: "Acepto política de privacidad", type: "checkbox", required: true, active: true, order: 10 },
];

const defaultPricingRules: PriceRule[] = [
  { id: "20_std", tipo_contenedor: "Contenedor 20 pies estándar", precio_contenedor: 1800, precio_transporte: 450, active: true },
  { id: "40_std", tipo_contenedor: "Contenedor 40 pies estándar", precio_contenedor: 2500, precio_transporte: 450, active: true },
  { id: "40_hc", tipo_contenedor: "Contenedor 40 pies High Cube", precio_contenedor: 2700, precio_transporte: 450, active: true },
  { id: "reefer", tipo_contenedor: "Contenedor refrigerado", precio_contenedor: 6000, precio_transporte: 450, active: true },
  { id: "baleares_cp07", tipo_contenedor: "*", codigo_postal_desde: "07000", codigo_postal_hasta: "07999", precio_contenedor: 0, precio_transporte: 1500, active: true, observaciones: "Sobrescribe transporte en Baleares" },
];

async function readOrDefault<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

export const getBotSettings = () => readOrDefault(BOT_SETTINGS_FILE, defaultBotSettings);
export const saveBotSettings = async (settings: BotSettings) => fs.writeFile(BOT_SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
export const getLeadFields = () => readOrDefault(LEAD_FIELDS_FILE, defaultLeadFields);
export const saveLeadFields = async (fields: LeadFieldConfig[]) => fs.writeFile(LEAD_FIELDS_FILE, JSON.stringify(fields, null, 2), "utf8");
export const getPriceRules = () => readOrDefault(PRICING_FILE, defaultPricingRules);
export const savePriceRules = async (rules: PriceRule[]) => fs.writeFile(PRICING_FILE, JSON.stringify(rules, null, 2), "utf8");
