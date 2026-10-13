"use client";

import { useState } from "react";
import { registrarDevolucaoFornecedorComercio } from "@/app/comercio/actions";

type Item = { id: string; descricao: string; disponivel: number; unidade: string };

export function CommerceSupplierReturnForm({ entryId, items }: { entryId: string; items: Item[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const selected = items
    .map(item => ({ entry_item_id: item.id, quantidade: quantities[item.id] || 0 }))
    .filter(item => item.quantidade > 0);

  return <form action={registrarDevolucaoFornecedorComercio.bind(null, entryId)} className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
    <h2 className="font-semibold text-orange-950">Devolução ao fornecedor</h2>
    <p className="mt-1 text-xs text-orange-800">Baixa o estoque e compensa o saldo a pagar. Valores já pagos ficam como crédito pendente com o fornecedor.</p>
    <input type="hidden" name="items" value={JSON.stringify(selected)} />
    <div className="mt-4 space-y-2">{items.map(item => <label key={item.id} className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-xl bg-white p-3 text-sm">
      <span>{item.descricao}<small className="ml-2 text-stone-500">Disponível: {item.disponivel} {item.unidade}</small></span>
      <input aria-label={`Quantidade devolvida de ${item.descricao}`} type="number" min="0" max={item.disponivel} step="0.0001" value={quantities[item.id] || ""} onChange={event => setQuantities(current => ({ ...current, [item.id]: Number(event.target.value) }))} placeholder="Qtd." className="rounded-lg border border-stone-300 px-3 py-2" />
    </label>)}</div>
    <input name="motivo" required minLength={3} placeholder="Motivo da devolução" className="mt-3 w-full rounded-xl border border-stone-300 bg-white p-3" />
    <button disabled={!selected.length} className="mt-3 w-full rounded-xl bg-orange-700 p-3 text-sm font-semibold text-white disabled:opacity-40">Confirmar devolução</button>
    <p className="mt-3 text-xs text-orange-800">A operação não emite NF-e de devolução. O documento fiscal deve ser validado pelo contador e emitido pelo provedor fiscal.</p>
  </form>;
}
