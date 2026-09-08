"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecessoPageEn() {
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
        body: JSON.stringify({ email, tipo, motivo, locale: "en" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unexpected error");

      setReference(data.reference);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link href="/en" className="text-sm text-amber-700 underline underline-offset-2">
        ← Back to home
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-stone-900">Exercise your right of withdrawal</h1>
      <p className="mt-2 text-sm text-stone-600">
        If you are a Consumer, you can withdraw from the contract using this form, without giving any
        reason. You&apos;ll receive a confirmation of receipt by email. For details, see our{" "}
        <Link href="/en/termini" className="text-amber-700 underline underline-offset-2">
          Terms &amp; Conditions
        </Link>
        .
      </p>

      {status === "sent" ? (
        <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          <p>Request received. We&apos;ve sent you a confirmation by email.</p>
          {reference && <p className="mt-2 text-xs text-emerald-700">Reference: {reference}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
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
              INCASSA subscription
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
            placeholder="Reason (optional)"
            rows={3}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "One moment…" : "Exercise the right of withdrawal"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
      )}
    </main>
  );
}
