"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function OrigenChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy el asistente comercial de Origen Contenedores. ¿Qué tipo de contenedor necesitas y en qué ciudad lo entregamos?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const chatData = await chatRes.json();

      if (!chatRes.ok) throw new Error(chatData.error ?? "Error en chat");

      setMessages((prev) => [...prev, { role: "assistant", content: chatData.assistantMessage }]);

      if (chatData.readyToSave) {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatData.lead),
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${(error as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="font-bold text-3xl">Demo Comercial · Origen Contenedores</h1>
      <div className="flex-1 space-y-3 rounded-xl border p-4">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={m.role === "assistant" ? "text-blue-700" : "text-zinc-800"}>
            <strong>{m.role === "assistant" ? "Asesor" : "Cliente"}:</strong> {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe tu mensaje"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button type="button" onClick={send} className="rounded-md bg-black px-4 py-2 text-white" disabled={loading}>
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </main>
  );
}
