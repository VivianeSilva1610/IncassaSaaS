"use client";

import { useState } from "react";

function mesAtual() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

export function RelatorioEstoqueForm() {
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
          <span className="mb-1 block text-xs text-stone-500">Período</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "mensal" | "anual")}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="mensal">Mês</option>
            <option value="anual">Ano</option>
          </select>
        </label>

        {tipo === "mensal" ? (
          <>
            <label className="text-sm text-stone-600">
              <span className="mb-1 block text-xs text-stone-500">De</span>
              <input
                type="month"
                value={de}
                max={mesAtual()}
                onChange={(e) => setDe(e.target.value)}
                className="rounded-md border border-stone-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm text-stone-600">
              <span className="mb-1 block text-xs text-stone-500">Até</span>
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
            <span className="mb-1 block text-xs text-stone-500">Ano</span>
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
          Baixar CSV
        </a>
        <a
          href={`/api/restaurante/export-estoque?formato=excel&${query}`}
          className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-emerald-600 active:scale-[0.98]"
        >
          Baixar Excel (.xlsx)
        </a>
      </div>
    </div>
  );
}
