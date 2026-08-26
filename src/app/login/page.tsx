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

    const supabase = createClient(rememberMe);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o password non corretti.");
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Accedi a INCASSA</h1>
      <p className="mt-2 text-sm text-stone-600">Inserisci email e password.</p>

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
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
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-4 flex justify-between text-xs text-stone-500">
        <Link href="/signup" className="text-amber-700 underline underline-offset-2">
          Crea un account
        </Link>
        <Link href="/recupera-password" className="text-amber-700 underline underline-offset-2">
          Password dimenticata?
        </Link>
      </div>
    </main>
  );
}
