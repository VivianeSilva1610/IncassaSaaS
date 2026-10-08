"use client";

import { useState } from "react";
import { confirmarPaisRestaurante } from "@/app/restaurante/actions";

type Pais = "BR" | "IT";

function detectarPais(digits: string): Pais | null {
  if (digits.length === 14) return "BR";
  if (digits.length === 11) return "IT";
  return null;
}

const NOME_PAIS: Record<Pais, string> = { BR: "🇧🇷 Brasil / Brasile", IT: "🇮🇹 Itália / Italia" };

export function DetectarPaisForm() {
  const [documento, setDocumento] = useState("");
  const [paisEscolhido, setPaisEscolhido] = useState<Pais | null>(null);
  const digits = documento.replace(/\D/g, "");
  const detectado = detectarPais(digits);
  const paisFinal = paisEscolhido ?? detectado;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-semibold text-stone-900">
        Antes de continuar: qual o documento fiscal do seu restaurante?
        <br />
        Prima di continuare: qual è il documento fiscale del tuo ristorante?
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        CNPJ (Brasil) ou Partita IVA (Itália) — documento da empresa, não CPF pessoal.
        <br />
        CNPJ (Brasile) o Partita IVA (Italia) — documento dell&apos;azienda, non codice fiscale personale.
      </p>
      <input
        value={documento}
        onChange={(event) => {
          setDocumento(event.target.value);
          setPaisEscolhido(null);
        }}
        placeholder="CNPJ ou Partita IVA"
        className="mt-3 w-full max-w-xs rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      {digits.length > 0 && (
        <p className="mt-2 text-sm">
          {detectado ? (
            <>
              Detectamos / Abbiamo rilevato: <strong>{NOME_PAIS[detectado]}</strong> ({digits.length} dígitos / cifre). Está correto? / È corretto?
            </>
          ) : (
            <span className="text-amber-700">
              Esse número tem {digits.length} dígitos — CNPJ tem 14, Partita IVA tem 11. Confira, ou escolha abaixo. /
              Questo numero ha {digits.length} cifre — il CNPJ ne ha 14, la Partita IVA 11. Verifica, o scegli qui sotto.
            </span>
          )}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setPaisEscolhido("BR")}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${paisFinal === "BR" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-600"}`}
        >
          🇧🇷 Brasil
        </button>
        <button
          type="button"
          onClick={() => setPaisEscolhido("IT")}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium ${paisFinal === "IT" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-600"}`}
        >
          🇮🇹 Itália / Italia
        </button>
      </div>
      <form action={confirmarPaisRestaurante} className="mt-3">
        <input type="hidden" name="country_code" value={paisFinal ?? ""} />
        <input type="hidden" name="documento" value={digits} />
        <button
          type="submit"
          disabled={!paisFinal}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Confirmar e continuar / Conferma e continua
        </button>
      </form>
    </div>
  );
}
