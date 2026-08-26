"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AggiornaPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Imposta una nuova password</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nuova password (almeno 6 caratteri)"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
        >
          {status === "sending" ? "Un attimo…" : "Salva nuova password"}
        </button>
        {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
      </form>
    </main>
  );
}
