"use client";

import { useMemo, useState } from "react";
import { criarCompraComercial } from "@/app/comercio/actions";

type Product = { id: string; nome: string; sku: string | null; custo_medio: number | string };
type Supplier = { id: string; nome: string };
type Item = { productId: string; quantidade: string; valorUnitario: string };
type Installment = { vencimento: string; valor: string };

const emptyItem = (): Item => ({ productId: "", quantidade: "1", valorUnitario: "0" });

export function CommercePurchaseForm({ products, suppliers }: { products: Product[]; suppliers: Supplier[] }) {
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [freight, setFreight] = useState("0");
  const [discount, setDiscount] = useState("0");
  const productTotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0), 0), [items]);
  const total = Math.max(0, productTotal + (Number(freight) || 0) - (Number(discount) || 0));

  function updateItem(index: number, patch: Partial<Item>) {
    setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  return <form action={criarCompraComercial} className="rounded-2xl border border-stone-200 bg-white p-5">
    <h2 className="text-lg font-semibold text-stone-900">Nova compra</h2>
    <p className="mt-1 text-xs text-stone-500">A compra ficará aguardando conferência antes de atualizar o estoque.</p>
    <input type="hidden" name="items" value={JSON.stringify(items.map(item => ({ product_id: item.productId, quantidade: Number(item.quantidade), valor_unitario: Number(item.valorUnitario) })))} />
    <input type="hidden" name="installments" value={JSON.stringify(installments.map(item => ({ vencimento: item.vencimento, valor: Number(item.valor) })))} />
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <select name="supplier_id" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm"><option value="">Sem fornecedor</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.nome}</option>)}</select>
      <input name="numero_documento" placeholder="Número do documento" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
    </div>
    <div className="mt-5 space-y-3">{items.map((item, index) => <div key={index} className="grid gap-2 rounded-xl bg-stone-50 p-3 sm:grid-cols-[1fr_110px_140px_auto]">
      <select required value={item.productId} onChange={event => { const product = products.find(row => row.id === event.target.value); updateItem(index, { productId: event.target.value, valorUnitario: product ? String(product.custo_medio) : "0" }); }} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"><option value="">Produto</option>{products.map(product => <option key={product.id} value={product.id}>{product.nome}{product.sku ? ` · ${product.sku}` : ""}</option>)}</select>
      <input aria-label="Quantidade" type="number" min="0.0001" step="0.0001" required value={item.quantidade} onChange={event => updateItem(index, { quantidade: event.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <input aria-label="Custo unitário" type="number" min="0" step="0.0001" required value={item.valorUnitario} onChange={event => updateItem(index, { valorUnitario: event.target.value })} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
      <button type="button" disabled={items.length === 1} onClick={() => setItems(current => current.filter((_, i) => i !== index))} className="rounded-lg border border-stone-300 px-3 text-sm text-red-700 disabled:opacity-40">Remover</button>
    </div>)}</div>
    <button type="button" onClick={() => setItems(current => [...current, emptyItem()])} className="mt-3 text-sm font-semibold text-amber-700">+ Adicionar produto</button>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><input name="valor_frete" type="number" min="0" step="0.01" value={freight} onChange={event => setFreight(event.target.value)} placeholder="Frete" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm"/><input name="valor_desconto" type="number" min="0" step="0.01" value={discount} onChange={event => setDiscount(event.target.value)} placeholder="Desconto" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm"/></div>
    <textarea name="observacoes" placeholder="Observações" className="mt-3 min-h-20 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
    <div className="mt-5 flex items-center justify-between"><div><p className="text-xs text-stone-500">Total da compra</p><p className="text-xl font-bold text-stone-950">R$ {total.toFixed(2)}</p></div><button type="button" onClick={() => setInstallments(current => [...current, { vencimento: "", valor: current.length ? "0" : total.toFixed(2) }])} className="text-sm font-semibold text-amber-700">+ Gerar conta a pagar</button></div>
    {installments.length > 0 && <div className="mt-3 space-y-2">{installments.map((installment, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2"><input aria-label="Vencimento" type="date" required value={installment.vencimento} onChange={event => setInstallments(current => current.map((row, i) => i === index ? { ...row, vencimento: event.target.value } : row))} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"/><input aria-label="Valor da parcela" type="number" min="0.01" step="0.01" required value={installment.valor} onChange={event => setInstallments(current => current.map((row, i) => i === index ? { ...row, valor: event.target.value } : row))} className="rounded-lg border border-stone-300 px-3 py-2 text-sm"/><button type="button" onClick={() => setInstallments(current => current.filter((_, i) => i !== index))} className="px-2 text-sm text-red-700">×</button></div>)}</div>}
    <button disabled={!products.length} className="mt-5 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Criar compra para conferência</button>
  </form>;
}

