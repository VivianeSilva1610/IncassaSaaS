"use client";

import { useEffect, useState } from "react";
import type { RestauranteLocale } from "@/lib/subscription";

const CHAVE_SESSION_STORAGE = "incassa_restaurante_aba_id";
const INTERVALO_PING_MS = 20_000;
const INTERVALO_PING_BLOQUEADO_MS = 10_000;

const CONTEUDO: Record<RestauranteLocale, { titulo: string; descricao: string; dica: string; link: string }> = {
  "pt-BR": {
    titulo: "Limite de abas simultâneas atingido",
    descricao: "Seu plano permite até 3 abas abertas ao mesmo tempo nesta conta. Esta é a 4ª.",
    dica: "Feche uma das outras abas pra liberar vaga aqui, ou contrate o complemento de abas ilimitadas.",
    link: "Ver meu plano",
  },
  it: {
    titulo: "Limite di schede simultanee raggiunto",
    descricao: "Il tuo piano permette fino a 3 schede aperte contemporaneamente in questo account. Questa è la 4ª.",
    dica: "Chiudi una delle altre schede per liberare un posto qui, oppure attiva il componente aggiuntivo di schede illimitate.",
    link: "Vedi il mio piano",
  },
};

function getAbaId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(CHAVE_SESSION_STORAGE);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(CHAVE_SESSION_STORAGE, id);
  }
  return id;
}

export function AbaSessionGate({ locale }: { locale: RestauranteLocale }) {
  const [bloqueado, setBloqueado] = useState(false);
  const t = CONTEUDO[locale];

  useEffect(() => {
    const abaId = getAbaId();
    let ativo = true;

    async function ping() {
      try {
        const res = await fetch("/api/restaurante/abas/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ abaId }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { bloqueado: boolean };
        if (ativo) setBloqueado(data.bloqueado);
      } catch {
        // Falha de rede não deve travar a aba — só tenta de novo no próximo ciclo.
      }
    }

    ping();
    const intervalo = setInterval(ping, bloqueado ? INTERVALO_PING_BLOQUEADO_MS : INTERVALO_PING_MS);

    function liberarAoFechar() {
      const payload = new Blob([JSON.stringify({ abaId })], { type: "application/json" });
      navigator.sendBeacon?.("/api/restaurante/abas/liberar", payload);
    }
    window.addEventListener("beforeunload", liberarAoFechar);

    return () => {
      ativo = false;
      clearInterval(intervalo);
      window.removeEventListener("beforeunload", liberarAoFechar);
    };
  }, [bloqueado]);

  if (!bloqueado) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 p-4">
      <div className="max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <h2 className="text-lg font-bold text-stone-900">{t.titulo}</h2>
        <p className="mt-2 text-sm text-stone-600">{t.descricao}</p>
        <p className="mt-2 text-sm text-stone-600">{t.dica}</p>
        <a href="/restaurante/plano" className="mt-4 inline-block rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {t.link}
        </a>
      </div>
    </div>
  );
}
