"use client";

import { useState } from "react";
import { calculateProductCost } from "@/lib/delivery/pricing";
import type { RestauranteLocale } from "@/lib/subscription";

type Tamanho = { id: string; nome: string; preco: number; maxAcompanhamentos: number };
type Produto = { id: string; nome: string };
type FichaTecnica = { quantidadeNecessaria: number; custoUnitario: number | null };

const CONTEUDO: Record<RestauranteLocale, {
  tamanho: string; selecione: string; principal: string; acompanhamentos: string; nenhumAcompanhamento: string;
  semFichaUm: string; semFichaVarios: (n: number) => string; semFichaSufixo: string; custoVariavel: string;
  custoFixoRateado: string; custoTotalPrato: string; precoSugerido: string; precoAtualDe: (nome: string, valor: string) => string;
  margemAtual: (pct: string) => string;
}> = {
  "pt-BR": {
    tamanho: "Tamanho", selecione: "Selecione…", principal: "Principal", acompanhamentos: "Acompanhamentos",
    nenhumAcompanhamento: "Nenhum acompanhamento cadastrado.",
    semFichaUm: "Um item selecionado não tem", semFichaVarios: (n) => `${n} itens selecionados não têm`,
    semFichaSufixo: "ficha técnica cadastrada — o custo abaixo não inclui essa parte do prato.",
    custoVariavel: "Custo variável", custoFixoRateado: "Custo fixo rateado", custoTotalPrato: "Custo total do prato",
    precoSugerido: "Preço sugerido", precoAtualDe: (nome, valor) => `Preço atual do ${nome}: ${valor}`,
    margemAtual: (pct) => `margem atual: ${pct}%`,
  },
  it: {
    tamanho: "Formato", selecione: "Seleziona…", principal: "Principale", acompanhamentos: "Contorni",
    nenhumAcompanhamento: "Nessun contorno registrato.",
    semFichaUm: "Un articolo selezionato non ha", semFichaVarios: (n) => `${n} articoli selezionati non hanno`,
    semFichaSufixo: "scheda tecnica registrata — il costo sotto non include questa parte del piatto.",
    custoVariavel: "Costo variabile", custoFixoRateado: "Costo fisso ripartito", custoTotalPrato: "Costo totale del piatto",
    precoSugerido: "Prezzo suggerito", precoAtualDe: (nome, valor) => `Prezzo attuale del ${nome}: ${valor}`,
    margemAtual: (pct) => `margine attuale: ${pct}%`,
  },
};

export function PranzoCustoCalculator({
  tamanhos,
  principais,
  acompanhamentos,
  fichaTecnicaPorProduto,
  totalCustosFixos,
  volumeMensalEstimado,
  margemDesejada,
  locale = "pt-BR",
}: {
  tamanhos: Tamanho[];
  principais: Produto[];
  acompanhamentos: Produto[];
  fichaTecnicaPorProduto: Record<string, FichaTecnica[]>;
  totalCustosFixos: number;
  volumeMensalEstimado: number;
  margemDesejada: number;
  locale?: RestauranteLocale;
}) {
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
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
          <span className="mb-1 block text-xs text-stone-500">{t.tamanho}</span>
          <select
            value={tamanhoId}
            onChange={(e) => {
              setTamanhoId(e.target.value);
              setAcompanhamentoIds([]);
            }}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">{t.selecione}</option>
            {tamanhos.map((tam) => (
              <option key={tam.id} value={tam.id}>
                {tam.nome} — {formatReal(tam.preco)} ({tam.maxAcompanhamentos} {t.acompanhamentos.toLowerCase()})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.principal}</span>
          <select value={principalId} onChange={(e) => setPrincipalId(e.target.value)} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="">{t.selecione}</option>
            {principais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>
      </div>

      {tamanhoSelecionado && (
        <div className="mt-3">
          <p className="text-xs font-medium text-stone-500">
            {t.acompanhamentos} ({acompanhamentoIds.length}/{tamanhoSelecionado.maxAcompanhamentos})
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            {acompanhamentos.map((a) => (
              <label key={a.id} className="flex items-center gap-1 text-sm text-stone-700">
                <input type="checkbox" checked={acompanhamentoIds.includes(a.id)} onChange={() => toggleAcompanhamento(a.id)} />
                {a.nome}
              </label>
            ))}
            {acompanhamentos.length === 0 && <p className="text-sm text-stone-500">{t.nenhumAcompanhamento}</p>}
          </div>
        </div>
      )}

      {montouAlgumaCoisa && (
        <>
          {semFichaTecnica.length > 0 && (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⚠ {semFichaTecnica.length === 1 ? t.semFichaUm : t.semFichaVarios(semFichaTecnica.length)} {t.semFichaSufixo}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-stone-500">{t.custoVariavel}</p>
              <p className="font-medium text-stone-900">{formatReal(custoVariavel)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">{t.custoFixoRateado}</p>
              <p className="font-medium text-stone-900">{formatReal(custoFixoRateado)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">{t.custoTotalPrato}</p>
              <p className="font-medium text-stone-900">{formatReal(custoTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">{t.precoSugerido}</p>
              <p className="font-semibold text-emerald-700">{formatReal(precoSugerido)}</p>
            </div>
          </div>
          {tamanhoSelecionado && (
            <p className="mt-2 text-xs text-stone-500">
              {t.precoAtualDe(tamanhoSelecionado.nome, formatReal(precoAtual))}
              {precoAtual > 0 && ` · ${t.margemAtual((margemAtual * 100).toFixed(0))}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
