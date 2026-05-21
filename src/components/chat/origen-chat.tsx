"use client";
import { useState } from "react";
import { LeadConfirmationForm } from "@/components/chat/lead-confirmation-form";
import type { LeadFicha } from "@/lib/leads";

type Message = { role: "user" | "assistant"; content: string };

export function OrigenChat() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Hola, soy el asistente comercial de Origen Contenedores." }]);
  const [candidateLead, setCandidateLead] = useState<LeadFicha | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user", content: input.trim() } as Message];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Error");
      setMessages((p) => [...p, { role: "assistant", content: data.assistantMessage }]);
      setCandidateLead(data.readyForConfirmation ? data.lead : null);
    } catch { setMessages((p) => [...p, { role: "assistant", content: "No he podido procesar el mensaje." }]); }
    finally { setLoading(false); }
  };

  const submitLead = async (lead: LeadFicha) => {
    setLoading(true);
    try {
      const response = await fetch("/api/leads/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
      if (!response.ok) {
        setMessages((p) => [...p, { role: "assistant", content: "La ficha se ha generado, pero no se ha podido enviar. Inténtalo de nuevo." }]);
        return;
      }
      setMessages((p) => [...p, { role: "assistant", content: "Solicitud enviada correctamente. Te contactaremos pronto." }]);
      setCandidateLead(null);
    } finally { setLoading(false); }
  };

  return <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6"><h1 className="font-bold text-3xl">Demo Comercial · Origen Contenedores</h1><div className="flex-1 space-y-3 rounded-xl border p-4">{messages.map((m, i) => <div key={`${m.role}-${i}`}><strong>{m.role === "assistant" ? "Asesor" : "Cliente"}:</strong> {m.content}</div>)}</div>{candidateLead && <LeadConfirmationForm lead={candidateLead} onSubmit={submitLead} loading={loading} />}<div className="flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="flex-1 rounded border px-3 py-2" /><button type="button" onClick={send} disabled={loading} className="rounded bg-black px-4 py-2 text-white">Enviar</button></div></main>;
}
