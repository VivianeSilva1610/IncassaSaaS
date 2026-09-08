"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function RecuperaPasswordPageEn() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/en/auth/aggiorna-password`,
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Reset your password</h1>
      <p className="mt-2 text-sm text-stone-600">We&apos;ll send you a link to set a new one.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Check your email ({email}) and click the link to choose a new password.
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
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "One moment…" : "Send reset link"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
        </form>
      )}

      <p className="mt-4 text-xs text-stone-500">
        <Link href="/en/login" className="text-amber-700 underline underline-offset-2">
          Back to login
        </Link>
      </p>
    </main>
  );
}
