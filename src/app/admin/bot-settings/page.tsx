"use client";
import { useEffect, useState } from "react";

export default function BotSettingsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/bot-settings").then((r) => r.json()).then(setData); }, []);
  if (!data) return <main className="p-6">Cargando...</main>;
  return <main className="space-y-4 p-6"><h1 className="font-bold text-2xl">Bot settings</h1><textarea className="w-full border p-2" value={data.settings.generalInstructions} onChange={(e) => setData({ ...data, settings: { ...data.settings, generalInstructions: e.target.value } })} />{data.fields.map((f: any, i: number) => <label key={f.key} className="block"><input type="checkbox" checked={f.active} onChange={(e) => { const fields = [...data.fields]; fields[i] = { ...fields[i], active: e.target.checked }; setData({ ...data, fields }); }} /> {f.label}</label>)}<button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={() => fetch("/api/bot-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })}>Guardar</button></main>;
}
