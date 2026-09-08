"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecessoPage() {
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState<"saas" | "kit">("saas");
  const [motivo, setMotivo] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/recesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tipo, motivo, locale: "it" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Errore imprevisto");

      setReference(data.reference);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Errore imprevisto");
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/" className="text-sm text-amber-700 underline underline-offset-2">
        ← Torna alla home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Esercita il diritto di recesso</h1>
      <p className="mt-2 text-sm text-stone-600">
        Se sei un Consumatore, puoi recedere dal contratto usando questo modulo, senza dover fornire
        alcuna motivazione. Riceverai una conferma di ricezione via email. Per i dettagli, consulta i{" "}
        <Link href="/termini" className="text-amber-700 underline underline-offset-2">
          Termini e Condizioni
        </Link>
        .
      </p>

      {status === "sent" ? (
        <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          <p>Richiesta ricevuta. Ti abbiamo inviato una conferma via email.</p>
          {reference && <p className="mt-2 text-xs text-emerald-700">Riferimento: {reference}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="La tua email"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />

          <div className="space-y-1.5 rounded-md border border-stone-300 p-3">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="radio"
                name="tipo"
                checked={tipo === "saas"}
                onChange={() => setTipo("saas")}
              />
              Abbonamento INCASSA
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="radio"
                name="tipo"
                checked={tipo === "kit"}
                onChange={() => setTipo("kit")}
              />
              Kit Incassa
            </label>
          </div>

          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivazione (facoltativa)"
            rows={3}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "Un attimo…" : "Esercita il diritto di recesso"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
      )}
    </main>
  );
}
