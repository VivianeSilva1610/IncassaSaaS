"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

const strings = {
  it: { cta: "Voglio il Kit Incassa — €9", unAttimo: "Un attimo…", errore: "Qualcosa è andato storto. Riprova tra qualche istante." },
  en: { cta: "I want the Kit Incassa — €9", unAttimo: "One moment…", errore: "Something went wrong. Please try again shortly." },
};

export function CheckoutButton({ className, locale = "it" }: { className?: string; locale?: Locale }) {
  const t = strings[locale];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(true);
        setLoading(false);
      }
    } catch {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? t.unAttimo : t.cta}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{t.errore}</p>}
    </div>
  );
}
