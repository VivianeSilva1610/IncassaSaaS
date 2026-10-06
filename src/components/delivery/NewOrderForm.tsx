"use client";

import { useState } from "react";
import { createOrder } from "@/app/restaurante/actions";

type Product = { id: string; nome: string; preco: number };
type Tamanho = { id: string; nome: string; preco: number; maxAcompanhamentos: number };
type CardapioDia = { diaSemana: number; productId: string };

type FixedRow = { key: number; productId: string; label: string; preco: number; groupKey: number };
type FreeRow = { key: number };

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function NewOrderForm({
  products,
  tamanhos = [],
  principais = [],
  acompanhamentos = [],
  extras = [],
  cardapioSemana = [],
  isOwner = false,
}: {
  products: Product[];
  tamanhos?: Tamanho[];
  principais?: Product[];
  acompanhamentos?: Product[];
  extras?: Product[];
  cardapioSemana?: CardapioDia[];
  isOwner?: boolean;
}) {
  const [freeRows, setFreeRows] = useState<FreeRow[]>([{ key: 0 }]);
  const [fixedRows, setFixedRows] = useState<FixedRow[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [nextGroupKey, setNextGroupKey] = useState(0);

  const [diaSemana, setDiaSemana] = useState(new Date().getDay());
  const [tamanhoId, setTamanhoId] = useState("");
  const [principalId, setPrincipalId] = useState("");
  const [acompanhamentoIds, setAcompanhamentoIds] = useState<string[]>([]);
  const [extraQtds, setExtraQtds] = useState<Record<string, number>>({});

  const temMonteSeuPranzo = tamanhos.length > 0 && principais.length > 0 && acompanhamentos.length > 0;
  const tamanhoSelecionado = tamanhos.find((t) => t.id === tamanhoId);
  const principaisDoDia = principais.filter((p) =>
    cardapioSemana.some((c) => c.diaSemana === diaSemana && c.productId === p.id),
  );

  function addFreeRow() {
    setFreeRows((prev) => [...prev, { key: nextKey }]);
    setNextKey((k) => k + 1);
  }

  function removeFreeRow(key: number) {
    setFreeRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function toggleAcompanhamento(id: string) {
    setAcompanhamentoIds((prev) => {
      if (prev.includes(id)) return prev.filter((a) => a !== id);
      if (tamanhoSelecionado && prev.length >= tamanhoSelecionado.maxAcompanhamentos) return prev;
      return [...prev, id];
    });
  }

  function adicionarPranzo() {
    if (!tamanhoSelecionado || !principalId) return;

    const groupKey = nextGroupKey;
    setNextGroupKey((g) => g + 1);

    const novasRows: FixedRow[] = [];
    let key = nextKey;

    novasRows.push({
      key: key++,
      productId: tamanhoSelecionado.id,
      label: tamanhoSelecionado.nome,
      preco: tamanhoSelecionado.preco,
      groupKey,
    });

    const principal = principais.find((p) => p.id === principalId);
    if (principal) {
      novasRows.push({ key: key++, productId: principal.id, label: principal.nome, preco: 0, groupKey });
    }

    for (const accId of acompanhamentoIds) {
      const acc = acompanhamentos.find((a) => a.id === accId);
      if (acc) novasRows.push({ key: key++, productId: acc.id, label: acc.nome, preco: 0, groupKey });
    }

    for (const [extraId, qtd] of Object.entries(extraQtds)) {
      if (qtd <= 0) continue;
      const extra = extras.find((e) => e.id === extraId);
      if (extra) {
        for (let i = 0; i < qtd; i++) {
          novasRows.push({ key: key++, productId: extra.id, label: extra.nome, preco: extra.preco, groupKey });
        }
      }
    }

    setFixedRows((prev) => [...prev, ...novasRows]);
    setNextKey(key);
    setTamanhoId("");
    setPrincipalId("");
    setAcompanhamentoIds([]);
    setExtraQtds({});
  }

  function removerGrupo(groupKey: number) {
    setFixedRows((prev) => prev.filter((r) => r.groupKey !== groupKey));
  }

  if (products.length === 0 && !temMonteSeuPranzo) {
    return (
      <p className="mt-6 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">
        Adicione pelo menos um item ao menu antes de registrar um pedido.
      </p>
    );
  }

  const gruposUnicos = Array.from(new Set(fixedRows.map((r) => r.groupKey)));

  return (
    <form action={createOrder} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="cliente_nome" placeholder="Nome do cliente (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="cliente_telefone" placeholder="Telefone (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="canal" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="telefone">Telefone (delivery)</option>
          <option value="whatsapp">WhatsApp (delivery)</option>
          <option value="balcao">Balcão (consumo local — prato)</option>
        </select>
        <input
          name="taxa_entrega"
          type="number"
          step="0.01"
          min="0"
          defaultValue={0}
          placeholder="Taxa de entrega (R$)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input name="note" placeholder="Observações (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        {isOwner && (
          <label className="flex items-center gap-2 text-xs text-stone-700 sm:col-span-2">
            <input type="checkbox" name="a_prazo" />
            Pedido a prazo (fiado) — gera uma fatura no INCASSA com o nome do cliente, pra cobrar depois
          </label>
        )}
      </div>

      {temMonteSeuPranzo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-stone-900">Monte o Pranzo</p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              value={diaSemana}
              onChange={(e) => {
                setDiaSemana(Number(e.target.value));
                setPrincipalId("");
              }}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
            >
              {DIAS_SEMANA.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
            <select value={tamanhoId} onChange={(e) => setTamanhoId(e.target.value)} className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
              <option value="">Tamanho…</option>
              {tamanhos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} — {formatReal(t.preco)} ({t.maxAcompanhamentos} acompanhamentos)
                </option>
              ))}
            </select>
          </div>

          <select
            value={principalId}
            onChange={(e) => setPrincipalId(e.target.value)}
            disabled={principaisDoDia.length === 0}
            className="mt-2 w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs disabled:bg-stone-100 disabled:text-stone-400"
          >
            <option value="">Prato principal…</option>
            {principaisDoDia.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          {principaisDoDia.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              Nenhum principal definido para {DIAS_SEMANA[diaSemana]}. Cadastre em Cardápio → Cardápio da semana.
            </p>
          )}

          {tamanhoSelecionado && (
            <div className="mt-2">
              <p className="text-xs text-stone-600">
                Acompanhamentos ({acompanhamentoIds.length}/{tamanhoSelecionado.maxAcompanhamentos}):
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {acompanhamentos.map((a) => (
                  <label key={a.id} className="flex items-center gap-1 text-xs text-stone-700">
                    <input
                      type="checkbox"
                      checked={acompanhamentoIds.includes(a.id)}
                      onChange={() => toggleAcompanhamento(a.id)}
                    />
                    {a.nome}
                  </label>
                ))}
              </div>
            </div>
          )}

          {extras.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-stone-600">Extras:</p>
              <div className="mt-1 flex flex-wrap gap-3">
                {extras.map((e) => (
                  <label key={e.id} className="flex items-center gap-1 text-xs text-stone-700">
                    {e.nome} ({formatReal(e.preco)})
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={extraQtds[e.id] ?? 0}
                      onChange={(ev) => setExtraQtds((prev) => ({ ...prev, [e.id]: Number(ev.target.value) }))}
                      className="w-12 rounded-md border border-stone-300 px-1 py-0.5"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={adicionarPranzo}
            disabled={!tamanhoSelecionado || !principalId}
            className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            + Adicionar pranzo ao pedido
          </button>
        </div>
      )}

      {gruposUnicos.length > 0 && (
        <div className="space-y-2">
          {gruposUnicos.map((groupKey) => {
            const rowsDoGrupo = fixedRows.filter((r) => r.groupKey === groupKey);
            return (
              <div key={groupKey} className="rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">Pranzo</span>
                  <button type="button" onClick={() => removerGrupo(groupKey)} className="text-red-600 hover:underline">
                    Remover
                  </button>
                </div>
                <ul className="mt-1 text-stone-600">
                  {rowsDoGrupo.map((r) => (
                    <li key={r.key}>
                      {r.label}
                      {r.preco > 0 ? ` — ${formatReal(r.preco)}` : ""}
                    </li>
                  ))}
                </ul>
                {rowsDoGrupo.map((r) => (
                  <span key={r.key}>
                    <input type="hidden" name="product_id" value={r.productId} />
                    <input type="hidden" name="quantidade" value={1} />
                    <input type="hidden" name="preco_unitario" value={r.preco} />
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-900">Itens avulsos (pratos, bebidas…)</p>
        {freeRows.map((row) => (
          <div key={row.key} className="flex items-end gap-2">
            <select
              name="product_id"
              className="flex-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
              onChange={(e) => {
                const option = e.currentTarget.selectedOptions[0];
                const priceInput = e.currentTarget.parentElement?.querySelector<HTMLInputElement>(
                  'input[name="preco_unitario"]',
                );
                if (priceInput && option) priceInput.value = option.dataset.preco ?? "0";
              }}
            >
              <option value="">Item…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} data-preco={p.preco}>
                  {p.nome} — R${Number(p.preco).toFixed(2)}
                </option>
              ))}
            </select>
            <input
              name="quantidade"
              type="number"
              step="1"
              min="1"
              defaultValue={1}
              className="w-20 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
            />
            <input name="preco_unitario" type="hidden" defaultValue={0} />
            <button
              type="button"
              onClick={() => removeFreeRow(row.key)}
              className="rounded-md px-2 py-1.5 text-xs text-stone-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addFreeRow} className="text-xs text-amber-700 underline underline-offset-2">
        + Adicionar item avulso
      </button>

      <button
        type="submit"
        className="block w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
      >
        Registrar pedido
      </button>
    </form>
  );
}
