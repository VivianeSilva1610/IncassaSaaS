"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

const strings = {
  it: { unAttimo: "Un attimo…", gestisciAbbonamento: "Gestisci abbonamento", qualcosaAndato: "Qualcosa è andato storto." },
  en: { unAttimo: "One moment…", gestisciAbbonamento: "Manage subscription", qualcosaAndato: "Something went wrong." },
};

export function BillingPortalButton({ className, locale = "it" }: { className?: string; locale?: Locale }) {
  const t = strings[locale];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? t.qualcosaAndato);
        setLoading(false);
      }
    } catch {
      setError(t.qualcosaAndato);
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? t.unAttimo : t.gestisciAbbonamento}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
