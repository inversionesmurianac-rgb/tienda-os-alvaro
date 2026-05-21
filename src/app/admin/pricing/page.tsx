"use client";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const [rules, setRules] = useState<any[]>([]);
  useEffect(() => { fetch("/api/pricing").then((r) => r.json()).then((d) => setRules(d.rules)); }, []);
  return <main className="space-y-4 p-6"><h1 className="font-bold text-2xl">Pricing</h1>{rules.map((r, i) => <div key={r.id} className="rounded border p-2"><div>{r.tipo_contenedor}</div><input className="border p-1" value={r.precio_contenedor} onChange={(e) => { const n = [...rules]; n[i] = { ...n[i], precio_contenedor: Number(e.target.value) }; setRules(n); }} /></div>)}<button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => fetch("/api/pricing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules }) })}>Guardar precios</button></main>;
}
