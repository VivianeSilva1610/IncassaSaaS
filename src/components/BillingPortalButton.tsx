"use client";

import { useState } from "react";

export function BillingPortalButton({ className }: { className?: string }) {
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
        setError(data.error ?? "Qualcosa è andato storto.");
        setLoading(false);
      }
    } catch {
      setError("Qualcosa è andato storto.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Un attimo…" : "Gestisci abbonamento"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
