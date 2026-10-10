"use client";

import { useState } from "react";

export function AddonCheckoutButton({ tipo, label, loadingLabel, className }: { tipo: "modulos" | "equipe" | "abas"; label: string; loadingLabel: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/restaurante/addon-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErro(data.error ?? "Não foi possível iniciar o pagamento.");
        setLoading(false);
      }
    } catch {
      setErro("Não foi possível iniciar o pagamento.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? loadingLabel : label}
      </button>
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
