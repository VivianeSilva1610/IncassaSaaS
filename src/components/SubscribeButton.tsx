"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

const strings = {
  it: { unAttimo: "Un attimo…", inizia: "Inizia il trial gratuito di 7 giorni" },
  en: { unAttimo: "One moment…", inizia: "Start your 7-day free trial" },
};

export function SubscribeButton({ className, locale = "it" }: { className?: string; locale?: Locale }) {
  const t = strings[locale];
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? t.unAttimo : t.inizia}
    </button>
  );
}
