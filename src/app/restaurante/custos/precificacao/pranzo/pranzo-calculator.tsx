"use client";

import { useState } from "react";
import { calculateProductCost } from "@/lib/delivery/pricing";

type Tamanho = { id: string; nome: string; preco: number; maxAcompanhamentos: number };
type Produto = { id: string; nome: string };
type FichaTecnica = { quantidadeNecessaria: number; custoUnitario: number | null };

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function PranzoCustoCalculator({
  tamanhos,
  principais,
  acompanhamentos,
  fichaTecnicaPorProduto,
  totalCustosFixos,
  volumeMensalEstimado,
  margemDesejada,
}: {
  tamanhos: Tamanho[];
  principais: Produto[];
  acompanhamentos: Produto[];
  fichaTecnicaPorProduto: Record<string, FichaTecnica[]>;
  totalCustosFixos: number;
  volumeMensalEstimado: number;
  margemDesejada: number;
}) {
  const [tamanhoId, setTamanhoId] = useState("");
  const [principalId, setPrincipalId] = useState("");
  const [acompanhamentoIds, setAcompanhamentoIds] = useState<string[]>([]);

  const tamanhoSelecionado = tamanhos.find((t) => t.id === tamanhoId);

  function toggleAcompanhamento(id: string) {
    setAcompanhamentoIds((prev) => {
      if (prev.includes(id)) return prev.filter((a) => a !== id);
      if (tamanhoSelecionado && prev.length >= tamanhoSelecionado.maxAcompanhamentos) return prev;
      return [...prev, id];
    });
  }

  const produtosSelecionados = [tamanhoId, principalId, ...acompanhamentoIds].filter(Boolean);
  const semFichaTecnica = produtosSelecionados.filter((id) => !fichaTecnicaPorProduto[id]?.length);
  const ingredientesCombinados = produtosSelecionados.flatMap((id) =>
    (fichaTecnicaPorProduto[id] ?? []).map((item) => ({
      quantidade_necessaria: item.quantidadeNecessaria,
      custo_unitario: item.custoUnitario,
    })),
  );

  const { custoVariavel, custoFixoRateado, custoTotal, precoSugerido } = calculateProductCost({
    ingredientes: ingredientesCombinados,
    totalCustosFixos,
    volumeMensalEstimado,
    margemDesejada,
  });

  const precoAtual = tamanhoSelecionado?.preco ?? 0;
  const margemAtual = precoAtual > 0 ? (precoAtual - custoTotal) / precoAtual : 0;
  const montouAlgumaCoisa = produtosSelecionados.length > 0;

  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Tamanho</span>
          <select
            value={tamanhoId}
            onChange={(e) => {
              setTamanhoId(e.target.value);
              setAcompanhamentoIds([]);
            }}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {tamanhos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} — {formatReal(t.preco)} ({t.maxAcompanhamentos} acompanhamentos)
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Principal</span>
          <select value={principalId} onChange={(e) => setPrincipalId(e.target.value)} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="">Selecione…</option>
            {principais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>
      </div>

      {tamanhoSelecionado && (
        <div className="mt-3">
          <p className="text-xs font-medium text-stone-500">
            Acompanhamentos ({acompanhamentoIds.length}/{tamanhoSelecionado.maxAcompanhamentos})
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            {acompanhamentos.map((a) => (
              <label key={a.id} className="flex items-center gap-1 text-sm text-stone-700">
                <input type="checkbox" checked={acompanhamentoIds.includes(a.id)} onChange={() => toggleAcompanhamento(a.id)} />
                {a.nome}
              </label>
            ))}
            {acompanhamentos.length === 0 && <p className="text-sm text-stone-500">Nenhum acompanhamento cadastrado.</p>}
          </div>
        </div>
      )}

      {montouAlgumaCoisa && (
        <>
          {semFichaTecnica.length > 0 && (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⚠ {semFichaTecnica.length === 1 ? "Um item selecionado não tem" : `${semFichaTecnica.length} itens selecionados não têm`} ficha técnica cadastrada — o custo abaixo não inclui essa parte do prato.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-stone-500">Custo variável</p>
              <p className="font-medium text-stone-900">{formatReal(custoVariavel)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Custo fixo rateado</p>
              <p className="font-medium text-stone-900">{formatReal(custoFixoRateado)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Custo total do prato</p>
              <p className="font-medium text-stone-900">{formatReal(custoTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Preço sugerido</p>
              <p className="font-semibold text-emerald-700">{formatReal(precoSugerido)}</p>
            </div>
          </div>
          {tamanhoSelecionado && (
            <p className="mt-2 text-xs text-stone-500">
              Preço atual do {tamanhoSelecionado.nome}: {formatReal(precoAtual)}
              {precoAtual > 0 && ` · margem atual: ${(margemAtual * 100).toFixed(0)}%`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
