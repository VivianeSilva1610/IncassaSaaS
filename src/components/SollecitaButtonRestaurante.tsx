"use client";

import { useState } from "react";
import type { Tone } from "@/content/kit-incassa";
import { toneEmoji } from "@/lib/tone-styles";
import type { RestauranteLocale } from "@/lib/subscription";

const tones: Tone[] = ["Gentile", "Cordiale", "Diretto", "Formale"];

const toneLabel: Record<RestauranteLocale, Record<Tone, string>> = {
  "pt-BR": { Gentile: "Amigável", Cordiale: "Cordial", Diretto: "Direto", Formale: "Formal" },
  it: { Gentile: "Amichevole", Cordiale: "Cordiale", Diretto: "Diretto", Formale: "Formale" },
};

const CONTEUDO: Record<RestauranteLocale, {
  cobrar: string; escolhaTom: string; gerando: string; erroGenerico: string; iaIndisponivel: string;
  copiado: string; copiar: string; fechar: string;
}> = {
  "pt-BR": {
    cobrar: "Cobrar", escolhaTom: "Escolha o tom:", gerando: "Gerando a mensagem…",
    erroGenerico: "Algo deu errado. Tente de novo.", iaIndisponivel: "A IA não estava disponível: mensagem pronta no lugar.",
    copiado: "Copiado!", copiar: "Copiar", fechar: "Fechar",
  },
  it: {
    cobrar: "Sollecita", escolhaTom: "Scegli il tono:", gerando: "Generazione del messaggio…",
    erroGenerico: "Qualcosa è andato storto. Riprova.", iaIndisponivel: "L'IA non era disponibile: messaggio predefinito al suo posto.",
    copiado: "Copiato!", copiar: "Copia", fechar: "Chiudi",
  },
};

interface SollecitaResult {
  message: string;
  fallback: boolean;
  phone: string | null;
}

export function SollecitaButtonRestaurante({ contaId, locale = "pt-BR" }: { contaId: string; locale?: RestauranteLocale }) {
  const t = CONTEUDO[locale];
  const labels = toneLabel[locale];
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SollecitaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleTone(tono: Tone) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/restaurante/sollecita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contaId, tono }),
      });
      const data = await res.json();
      if (!res.ok || !data.message) {
        setError(data.error ?? t.erroGenerico);
      } else {
        setResult(data);
      }
    } catch {
      setError(t.erroGenerico);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  const whatsappUrl = result?.phone
    ? `https://wa.me/${result.phone}?text=${encodeURIComponent(result.message)}`
    : null;

  async function handleCopy() {
    if (!result?.message) return;
    await navigator.clipboard.writeText(result.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => (open ? handleClose() : setOpen(true))}
        className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:bg-stone-700 active:scale-95"
      >
        {t.cobrar}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-stone-200 bg-white p-4 shadow-lg">
          {!result && !loading && (
            <>
              <p className="mb-3 text-xs font-medium text-stone-500">{t.escolhaTom}</p>
              <div className="grid grid-cols-2 gap-2">
                {tones.map((tn) => (
                  <button
                    key={tn}
                    onClick={() => handleTone(tn)}
                    className="rounded-md border border-stone-200 px-2 py-1.5 text-sm hover:bg-stone-50"
                  >
                    {toneEmoji[tn]} {labels[tn]}
                  </button>
                ))}
              </div>
            </>
          )}

          {loading && <p className="text-sm text-stone-500">{t.gerando}</p>}

          {error && !loading && <p className="text-sm text-red-600">{error}</p>}

          {result && (
            <div>
              {result.fallback && (
                <p className="mb-2 text-xs text-amber-700">{t.iaIndisponivel}</p>
              )}
              <p className="whitespace-pre-wrap text-sm text-stone-800">{result.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                  >
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={handleCopy}
                  className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-300"
                >
                  {copied ? t.copiado : t.copiar}
                </button>
              </div>
            </div>
          )}

          <button onClick={handleClose} className="mt-3 text-xs text-stone-400 hover:text-stone-600">
            {t.fechar}
          </button>
        </div>
      )}
    </div>
  );
}
