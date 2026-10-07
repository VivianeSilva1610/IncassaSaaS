"use client";

import { useState } from "react";

export function RestauranteSubscribeButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch("/api/subscribe-restaurante", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErro(data.error ?? "Não foi possível iniciar a assinatura.");
        setLoading(false);
      }
    } catch {
      setErro("Não foi possível iniciar a assinatura.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Um momento…" : "Ativar assinatura (7 dias grátis)"}
      </button>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  );
}
