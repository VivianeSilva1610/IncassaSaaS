"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { trackMetaEvent } from "@/lib/meta-pixel";

export default function SignupPageEn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [accepts1341, setAccepts1341] = useState(false);
  const [acceptsImmediateStart, setAcceptsImmediateStart] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = acceptsTerms && accepts1341 && acceptsImmediateStart;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
        data: {
          locale: "en",
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
      <h1 className="text-2xl font-bold text-stone-900">Create your INCASSA account</h1>
      <p className="mt-2 text-sm text-stone-600">Just an email and a password.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Check your email ({email}, including spam and trash) and click the link to confirm your
          account. Then you can log in with the password you chose.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (at least 6 characters)"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />

          <div className="space-y-2 rounded-md border border-stone-200 bg-stone-50 p-3">
            <label className="flex items-start gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                required
                checked={acceptsTerms}
                onChange={(e) => setAcceptsTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I have read and accept the{" "}
                <Link href="/en/termini" target="_blank" className="text-amber-700 underline underline-offset-2">
                  Terms &amp; Conditions of Service
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                required
                checked={accepts1341}
                onChange={(e) => setAccepts1341(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                For Italian-law contracts, under Civil Code arts. 1341 and 1342, I state that I have
                read and specifically approve the clauses listed in the &quot;Specific
                approval&quot; section of the{" "}
                <Link href="/en/termini" target="_blank" className="text-amber-700 underline underline-offset-2">
                  Terms &amp; Conditions
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-stone-700">
              <input
                type="checkbox"
                required
                checked={acceptsImmediateStart}
                onChange={(e) => setAcceptsImmediateStart(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I expressly request that performance of the INCASSA service begin immediately,
                during the withdrawal period, and I acknowledge that once the service has been
                fully performed, where the law provides for it, I may lose my right of withdrawal.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={status === "sending" || !canSubmit}
            className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "One moment…" : "Create account"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
      )}

      <p className="mt-4 text-xs text-stone-500">
        Already have an account?{" "}
        <Link href="/en/login" className="text-amber-700 underline underline-offset-2">
          Log in
        </Link>
      </p>
    </main>
  );
}
