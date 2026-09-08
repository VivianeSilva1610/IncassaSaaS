"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { trackMetaEvent } from "@/lib/meta-pixel";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accettaTermini, setAccettaTermini] = useState(false);
  const [accetta1341, setAccetta1341] = useState(false);
  const [accettaEsecuzioneImmediata, setAccettaEsecuzioneImmediata] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const puoInviare = accettaTermini && accetta1341 && accettaEsecuzioneImmediata;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puoInviare) return;
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        data: {
          locale: "it",
          termini_accettati: true,
          consenso_1341_1342: true,
          consenso_esecuzione_immediata: true,
          consenso_registrato_il: new Date().toISOString(),
        },
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    trackMetaEvent("CompleteRegistration");
    setStatus("sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Crea il tuo account INCASSA</h1>
      <p className="mt-2 text-sm text-stone-600">Bastano email e password.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Controlla la tua email ({email}, anche spam e cestino) e clicca sul link per confermare
          l&apos;account. Dopo potrai accedere con la password che hai scelto.
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
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (almeno 6 caratteri)"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />

          <div className="space-y-2 rounded-md border border-stone-200 bg-stone-50 p-3">
            <label className="flex items-start gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                required
                checked={accettaTermini}
                onChange={(e) => setAccettaTermini(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Ho letto e accetto i{" "}
                <Link href="/termini" target="_blank" className="text-amber-700 underline underline-offset-2">
                  Termini e Condizioni di Servizio
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                required
                checked={accetta1341}
                onChange={(e) => setAccetta1341(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Ai sensi degli artt. 1341 e 1342 c.c., dichiaro di aver letto e approvare
                specificamente le clausole indicate nella sezione &quot;Approvazione specifica&quot;
                dei{" "}
                <Link href="/termini" target="_blank" className="text-amber-700 underline underline-offset-2">
                  Termini e Condizioni
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                required
                checked={accettaEsecuzioneImmediata}
                onChange={(e) => setAccettaEsecuzioneImmediata(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Richiedo espressamente che l&apos;esecuzione del servizio INCASSA abbia inizio
                immediatamente, durante il periodo di recesso, e riconosco che, una volta che il
                servizio sarà stato interamente eseguito nei casi previsti dalla legge, potrò perdere
                il diritto di recesso.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={status === "sending" || !puoInviare}
            className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "Un attimo…" : "Crea account"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
      )}

      <p className="mt-4 text-xs text-stone-500">
        Hai già un account?{" "}
        <Link href="/login" className="text-amber-700 underline underline-offset-2">
          Accedi
        </Link>
      </p>
    </main>
  );
}
