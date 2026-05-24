"use client";

import type { LeadFicha } from "@/lib/leads";

export function LeadConfirmationForm({ lead, onSubmit, loading }: { lead: LeadFicha; onSubmit: (lead: LeadFicha) => Promise<void>; loading: boolean }) {
  return (
    <div className="space-y-2 rounded border p-3">
      <h3 className="font-semibold">Confirma tu solicitud</h3>
      {(["nombre_empresa", "email", "telefono", "tipo_contenedor", "codigo_postal_entrega", "ciudad_entrega", "uso", "urgencia", "presupuesto_aproximado", "precio_estimado", "prioridad_lead", "resumen_comercial", "siguiente_accion"] as const).map((k) => (
        <div key={k} className="text-sm"><strong>{k}:</strong> {String(lead[k] ?? "")}</div>
      ))}
      <button type="button" disabled={loading} onClick={() => onSubmit(lead)} className="rounded bg-black px-3 py-2 text-white">{loading ? "Enviando..." : "Enviar solicitud"}</button>
    </div>
  );
}
