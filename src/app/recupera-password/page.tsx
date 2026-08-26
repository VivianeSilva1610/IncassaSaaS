"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/aggiorna-password`,
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Recupera la password</h1>
      <p className="mt-2 text-sm text-stone-600">Ti mandiamo un link per impostarne una nuova.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Controlla la tua email ({email}) e clicca sul link per scegliere una nuova password.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tuaemail@esempio.it"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "Un attimo…" : "Invia link di recupero"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">Qualcosa è andato storto. Riprova.</p>}
        </form>
      )}

      <p className="mt-4 text-xs text-stone-500">
        <Link href="/login" className="text-amber-700 underline underline-offset-2">
          Torna al login
        </Link>
      </p>
    </main>
  );
}
