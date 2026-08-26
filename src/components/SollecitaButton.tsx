"use client";

import { useState } from "react";
import type { Tone } from "@/content/kit-incassa";
import { toneEmoji } from "@/lib/tone-styles";

const tones: Tone[] = ["Gentile", "Cordiale", "Diretto", "Formale"];

interface SollecitaResult {
  messages: string[];
  fallback: boolean;
  phone: string | null;
  email: string | null;
}

export function SollecitaButton({ kind, id }: { kind: "fattura" | "preventivo"; id: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SollecitaResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleTone(tono: Tone) {
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedIndex(0);
    try {
      const res = await fetch("/api/sollecita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, tono }),
      });
      const data = await res.json();
      if (!res.ok || !data.messages?.length) {
        setError(data.error ?? "Qualcosa è andato storto. Riprova.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Qualcosa è andato storto. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  const selectedMessage = result?.messages[selectedIndex] ?? "";
  const whatsappUrl = result?.phone
    ? `https://wa.me/${result.phone}?text=${encodeURIComponent(selectedMessage)}`
    : null;
  const mailtoUrl = result?.email
    ? `mailto:${result.email}?subject=${encodeURIComponent("Sollecito pagamento")}&body=${encodeURIComponent(selectedMessage)}`
    : null;

  async function handleCopy() {
    if (!selectedMessage) return;
    await navigator.clipboard.writeText(selectedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <button
        onClick={() => (open ? handleClose() : setOpen(true))}
        className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:bg-stone-700 active:scale-95"
      >
        Sollecita
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-stone-200 bg-white p-4 shadow-lg">
          {!result && !loading && (
            <>
              <p className="mb-3 text-xs font-medium text-stone-500">Scegli il tono:</p>
              <div className="grid grid-cols-2 gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTone(t)}
                    className="rounded-md border border-stone-200 px-2 py-1.5 text-sm hover:bg-stone-50"
                  >
                    {toneEmoji[t]} {t}
                  </button>
                ))}
              </div>
            </>
          )}

          {loading && <p className="text-sm text-stone-500">Generando il messaggio…</p>}

          {error && !loading && <p className="text-sm text-red-600">{error}</p>}

          {result && (
            <div>
              {result.fallback && (
                <p className="mb-2 text-xs text-amber-700">
                  L&apos;IA non era disponibile: messaggi pronti dai nostri modelli.
                </p>
              )}

              {result.messages.length > 1 && (
                <div className="mb-2 flex gap-1">
                  {result.messages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedIndex(i)}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        i === selectedIndex
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      Opzione {i + 1}
                    </button>
                  ))}
                </div>
              )}

              <p className="whitespace-pre-wrap text-sm text-stone-800">{selectedMessage}</p>
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
                {mailtoUrl && (
                  <a
                    href={mailtoUrl}
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
                  >
                    Email
                  </a>
                )}
                <button
                  onClick={handleCopy}
                  className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-300"
                >
                  {copied ? "Copiato!" : "Copia"}
                </button>
              </div>
            </div>
          )}

          <button onClick={handleClose} className="mt-3 text-xs text-stone-400 hover:text-stone-600">
            Chiudi
          </button>
        </div>
      )}
    </div>
  );
}
