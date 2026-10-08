"use client";

import { useState } from "react";
import type { RestauranteLocale } from "@/lib/subscription";

function mesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

const CONTEUDO: Record<RestauranteLocale, {
  periodo: string; mes: string; ano: string; de: string; ate: string; baixarCsv: string; baixarExcel: string;
}> = {
  "pt-BR": { periodo: "Período", mes: "Mês", ano: "Ano", de: "De", ate: "Até", baixarCsv: "Baixar CSV", baixarExcel: "Baixar Excel (.xlsx)" },
  it: { periodo: "Periodo", mes: "Mese", ano: "Anno", de: "Da", ate: "A", baixarCsv: "Scarica CSV", baixarExcel: "Scarica Excel (.xlsx)" },
};

export function RelatorioEstoqueForm({ locale = "pt-BR" }: { locale?: RestauranteLocale }) {
  const t = CONTEUDO[locale];
  const [tipo, setTipo] = useState<"mensal" | "anual">("mensal");
  const [de, setDe] = useState(mesAtual());
  const [ate, setAte] = useState(mesAtual());
  const [ano, setAno] = useState(new Date().getFullYear());

  const query =
    tipo === "mensal" ? `periodo=mensal&de=${de}&ate=${ate}` : `periodo=anual&ano=${ano}`;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.periodo}</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "mensal" | "anual")}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="mensal">{t.mes}</option>
            <option value="anual">{t.ano}</option>
          </select>
        </label>

        {tipo === "mensal" ? (
          <>
            <label className="text-sm text-stone-600">
              <span className="mb-1 block text-xs text-stone-500">{t.de}</span>
              <input
                type="month"
                value={de}
                max={mesAtual()}
                onChange={(e) => setDe(e.target.value)}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-stone-600">
              <span className="mb-1 block text-xs text-stone-500">{t.ate}</span>
              <input
                type="month"
                value={ate}
                max={mesAtual()}
                onChange={(e) => setAte(e.target.value)}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
          </>
        ) : (
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">{t.ano}</span>
            <input
              type="number"
              value={ano}
              min="2000"
              max={new Date().getFullYear()}
              onChange={(e) => setAno(Number(e.target.value))}
              className="w-28 rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/api/restaurante/export-estoque?formato=csv&${query}`}
          className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
        >
          {t.baixarCsv}
        </a>
        <a
          href={`/api/restaurante/export-estoque?formato=excel&${query}`}
          className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-emerald-600 active:scale-[0.98]"
        >
          {t.baixarExcel}
        </a>
      </div>
    </div>
  );
}
