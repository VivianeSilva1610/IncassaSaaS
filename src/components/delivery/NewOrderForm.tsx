"use client";

import { useState } from "react";
import { createOrder } from "@/app/delivery-admin/actions";

type Product = { id: string; nome: string; preco: number };

export function NewOrderForm({ products }: { products: Product[] }) {
  const [rows, setRows] = useState([{ key: 0 }]);
  const [nextKey, setNextKey] = useState(1);

  function addRow() {
    setRows((prev) => [...prev, { key: nextKey }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  if (products.length === 0) {
    return (
      <p className="mt-6 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">
        Adicione pelo menos um item ao menu antes de registrar um pedido.
      </p>
    );
  }

  return (
    <form action={createOrder} className="mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="cliente_nome" placeholder="Nome do cliente (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="cliente_telefone" placeholder="Telefone (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="canal" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="telefone">Telefone</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <input name="note" placeholder="Observações (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-end gap-2">
            <select
              name="product_id"
              required
              className="flex-1 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
              onChange={(e) => {
                const option = e.currentTarget.selectedOptions[0];
                const priceInput = e.currentTarget.parentElement?.querySelector<HTMLInputElement>(
                  'input[name="preco_unitario"]',
                );
                if (priceInput && option) priceInput.value = option.dataset.preco ?? "0";
              }}
            >
              <option value="">Prato…</option>
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
              required
              className="w-20 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
            />
            <input name="preco_unitario" type="hidden" defaultValue={0} />
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              className="rounded-md px-2 py-1.5 text-xs text-stone-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addRow} className="text-xs text-amber-700 underline underline-offset-2">
        + Adicionar prato
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
