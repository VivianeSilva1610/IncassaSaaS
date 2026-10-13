"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient(rememberMe);
      const normalizedEmail = email.trim().toLowerCase();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

      if (signInError) {
        const diagnostic = process.env.NODE_ENV === "development"
          ? ` [Supabase: ${signInError.code ?? "sem código"}; HTTP ${signInError.status ?? "sem status"}; ${signInError.message}]`
          : "";

        if (signInError.code === "email_not_confirmed" || signInError.message.includes("Email not confirmed")) {
          setError(
            `Devi prima confermare la tua email. Controlla la posta in arrivo (anche spam e cestino) e clicca sul link che ti abbiamo mandato in fase di registrazione.${diagnostic}`,
          );
        } else if (signInError.status === 0 || signInError.code === "request_timeout") {
          setError(`Impossibile contattare il servizio di accesso. Controlla la connessione e riprova.${diagnostic}`);
        } else if (signInError.status === 429 || signInError.code === "over_request_rate_limit") {
          setError(`Troppi tentativi di accesso. Attendi qualche minuto e riprova.${diagnostic}`);
        } else if (signInError.code === "invalid_credentials") {
          setError(`Email o password non corretti. Verifica anche di usare lo stesso account registrato su INCASSA.${diagnostic}`);
        } else {
          setError(
            process.env.NODE_ENV === "development"
              ? `Accesso non riuscito (${signInError.code ?? signInError.status}): ${signInError.message}`
              : "Non è stato possibile accedere. Riprova tra poco.",
          );
        }
        return;
      }

      router.push("/sistemas");
      router.refresh();
    } catch {
      setError("Impossibile contattare il servizio di accesso. Controlla la connessione e riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Accedi</h1>
      <p className="mt-2 text-sm text-stone-600">Inserisci email e password.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-stone-700">Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tuaemail@esempio.it"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300"
          />
          Resta connesso su questo dispositivo
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Un attimo…" : "Accedi"}
        </button>
        {error && <p role="alert" aria-live="polite" className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-4 flex justify-between text-xs text-stone-500">
        <Link href="/escolher-sistema" className="text-amber-700 underline underline-offset-2">
          Crea un account
        </Link>
        <Link href="/recupera-password" className="text-amber-700 underline underline-offset-2">
          Password dimenticata?
        </Link>
      </div>
    </main>
  );
}
