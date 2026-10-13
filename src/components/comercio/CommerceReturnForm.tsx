"use client";

import { useState } from "react";
import { registrarDevolucaoComercial } from "@/app/comercio/actions";

type Item = { id: string; descricao: string; disponivel: number; unidade?: string };

export function CommerceReturnForm({ saleId, items }: { saleId: string; items: Item[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const selected = items.map(item => ({ sale_item_id: item.id, quantidade: quantities[item.id] || 0 })).filter(item => item.quantidade > 0);
  return <form action={registrarDevolucaoComercial.bind(null, saleId)} className="rounded-2xl border border-amber-200 bg-amber-50 p-5 print:hidden">
    <h2 className="font-semibold text-amber-950">Registrar troca ou devolução</h2><p className="mt-1 text-xs text-amber-800">Os itens retornam ao estoque. Informe o reembolso somente se o dinheiro já foi devolvido ao cliente.</p>
    <input type="hidden" name="items" value={JSON.stringify(selected)} />
    <div className="mt-4 space-y-2">{items.map(item => <label key={item.id} className="grid grid-cols-[1fr_110px] items-center gap-3 rounded-xl bg-white p-3 text-sm"><span>{item.descricao}<small className="ml-2 text-stone-500">Disponível: {item.disponivel}</small></span><input aria-label={`Quantidade devolvida de ${item.descricao}`} type="number" min="0" max={item.disponivel} step="0.0001" value={quantities[item.id] || ""} onChange={event => setQuantities(current => ({ ...current, [item.id]: Number(event.target.value) }))} placeholder="Qtd." className="rounded-lg border border-stone-300 px-3 py-2" /></label>)}</div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><input name="motivo" required minLength={3} placeholder="Motivo da devolução" className="rounded-xl border border-stone-300 bg-white p-3"/><select name="reembolso_forma" className="rounded-xl border border-stone-300 bg-white p-3"><option value="">Reembolso pendente</option><option value="dinheiro">Dinheiro já devolvido</option><option value="pix">Pix já devolvido</option><option value="debito">Débito estornado</option><option value="credito">Crédito estornado</option><option value="boleto">Boleto reembolsado</option><option value="outro">Outro reembolso realizado</option></select></div>
    <button disabled={!selected.length} className="mt-3 w-full rounded-xl bg-amber-700 p-3 text-sm font-semibold text-white disabled:opacity-40">Confirmar devolução</button>
  </form>;
}
