"use client";

import { useState } from "react";

export function CheckoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
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
        {loading ? "Un attimo…" : "Voglio il Kit Incassa — €9"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          Qualcosa è andato storto. Riprova tra qualche istante.
        </p>
      )}
    </div>
  );
}
