"use client";

import { useMemo, useState } from "react";
import { concluirVendaComercial } from "@/app/comercio/actions";
import { commerceQuantityStep, formatCommerceQuantity, normalizeCommerceQuantity } from "@/lib/commerce-quantity";

type Product = { id: string; productId: string; variantId: string | null; nome: string; sku: string | null; gtin: string | null; preco_venda: number; estoque_atual: number; unidade: string };
type Customer = { id: string; nome: string; documento: string | null };
type Payment = { id: number; forma: string; valor: number; recebido: number };
const paymentLabels: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", debito: "Cartão de débito", credito: "Cartão de crédito", boleto: "Boleto", crediario: "Crediário", outro: "Outro" };
const money = (value: number) => Math.round(value * 100) / 100;

export function CommercePdv({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([{ id: 1, forma: "", valor: 0, recebido: 0 }]);
  const filtered = products.filter(product => `${product.nome} ${product.sku ?? ""} ${product.gtin ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const items = useMemo(() => products.filter(product => cart[product.id]).map(product => ({ product, quantity: cart[product.id] })), [cart, products]);
  const subtotal = money(items.reduce((sum, item) => sum + Number(item.product.preco_venda) * item.quantity, 0));
  const safeDiscount = Math.min(Math.max(discount || 0, 0), subtotal);
  const total = money(Math.max(subtotal - safeDiscount, 0));
  const effectivePayments = payments.map(payment => ({ ...payment, valor: payments.length === 1 ? total : money(payment.valor || 0) }));
  const allocated = money(effectivePayments.reduce((sum, payment) => sum + payment.valor, 0));
  const remaining = money(total - allocated);
  const validPayments = effectivePayments.every(payment => payment.forma && payment.valor > 0 && (payment.forma !== "dinheiro" || payment.recebido >= payment.valor));
  const cashReceived = effectivePayments.filter(payment => payment.forma === "dinheiro").reduce((sum, payment) => sum + payment.recebido, 0);
  const cashAllocated = effectivePayments.filter(payment => payment.forma === "dinheiro").reduce((sum, payment) => sum + payment.valor, 0);
  const change = (id: string, quantity: number) => setCart(current => { const next = { ...current }; if (quantity <= 0) delete next[id]; else next[id] = normalizeCommerceQuantity(quantity); return next; });
  const add = (product: Product) => setCart(current => {
    const step = commerceQuantityStep(product.unidade);
    const stock = Number(product.estoque_atual);
    if (stock < step) return current;
    return { ...current, [product.id]: normalizeCommerceQuantity(Math.min((current[product.id] ?? 0) + step, stock)) };
  });
  const updatePayment = (id: number, patch: Partial<Payment>) => setPayments(current => current.map(payment => payment.id === id ? { ...payment, ...patch } : payment));
  const addPayment = () => setPayments(current => {
    if (current.length >= 5) return current;
    const prepared = current.length === 1 ? [{ ...current[0], valor: total }] : current;
    return [...prepared, { id: Math.max(...current.map(payment => payment.id)) + 1, forma: "", valor: 0, recebido: 0 }];
  });

  return <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
    <section><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nome, SKU ou código de barras" autoFocus className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm" /><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(product => { const step = commerceQuantityStep(product.unidade); const unavailable = Number(product.estoque_atual) < step; return <button type="button" key={product.id} onClick={() => add(product)} disabled={unavailable} title={unavailable && Number(product.estoque_atual) > 0 ? "Saldo fracionado inválido para esta unidade. Corrija pelo inventário." : undefined} className="rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-amber-300 disabled:opacity-50"><p className="font-semibold text-stone-800">{product.nome}</p><p className="mt-1 text-xs text-stone-500">{product.sku || product.gtin || "Sem código"}</p><div className="mt-4 flex justify-between text-sm"><span className="font-bold">R$ {Number(product.preco_venda).toFixed(2)}</span><span className="text-stone-500">{formatCommerceQuantity(Number(product.estoque_atual))} {product.unidade}</span></div>{unavailable && Number(product.estoque_atual) > 0 && <p className="mt-2 text-xs font-medium text-amber-700">Corrija o saldo fracionado no inventário</p>}</button> })}</div></section>
    <form action={concluirVendaComercial} className="h-fit rounded-2xl border border-stone-200 bg-white p-5 xl:sticky xl:top-24">
      <h2 className="font-semibold text-stone-900">Carrinho</h2><input type="hidden" name="cart" value={JSON.stringify(items.map(item => ({ productId: item.product.productId, variantId: item.product.variantId, quantity: item.quantity })))} /><input type="hidden" name="payments" value={JSON.stringify(effectivePayments.map(({ forma, valor, recebido }) => ({ forma, valor, recebido })))} />
      <div className="mt-4 max-h-64 divide-y divide-stone-100 overflow-y-auto">{items.map(({ product, quantity }) => { const step = commerceQuantityStep(product.unidade); return <div key={product.id} className="py-3"><div className="flex justify-between gap-3"><p className="text-sm font-medium">{product.nome}</p><p className="text-sm font-semibold">R$ {(Number(product.preco_venda) * quantity).toFixed(2)}</p></div><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => change(product.id, quantity - step)} className="h-7 w-7 rounded-lg border border-stone-200">−</button><span className="min-w-6 text-center text-sm">{formatCommerceQuantity(quantity)}</span><button type="button" onClick={() => change(product.id, Math.min(quantity + step, Number(product.estoque_atual)))} className="h-7 w-7 rounded-lg border border-stone-200">+</button></div></div> })}{!items.length && <p className="py-8 text-center text-sm text-stone-500">Adicione produtos à venda.</p>}</div>
      <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm"><div className="flex justify-between text-stone-500"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div><label className="flex items-center justify-between gap-4 text-stone-600"><span>Desconto</span><input name="desconto" value={discount || ""} onChange={event => setDiscount(Number(event.target.value))} type="number" min="0" max={subtotal} step="0.01" placeholder="0,00" className="w-28 rounded-lg border border-stone-300 px-2 py-1.5 text-right" /></label><div className="flex justify-between border-t border-stone-100 pt-3"><span className="font-semibold">Total</span><span className="text-xl font-bold">R$ {total.toFixed(2)}</span></div></div>
      <select name="customer_id" className="mt-4 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"><option value="">Consumidor não identificado</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.nome}{customer.documento ? ` · ${customer.documento}` : ""}</option>)}</select>
      <div className="mt-4 space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-stone-800">Pagamentos</p>{payments.length < 5 && <button type="button" onClick={addPayment} className="text-xs font-semibold text-amber-700">+ Combinar forma</button>}</div>{effectivePayments.map((payment, index) => <div key={payment.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3"><div className="flex gap-2"><select required value={payment.forma} onChange={event => updatePayment(payment.id, { forma: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm"><option value="">Forma de pagamento</option>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{payments.length > 1 && <input aria-label={`Valor do pagamento ${index + 1}`} value={payment.valor || ""} onChange={event => updatePayment(payment.id, { valor: Number(event.target.value) })} type="number" min="0.01" step="0.01" className="w-28 rounded-lg border border-stone-300 bg-white px-2 py-2 text-right text-sm" />}{payments.length > 1 && <button type="button" aria-label="Remover pagamento" onClick={() => setPayments(current => current.filter(item => item.id !== payment.id))} className="px-1 text-red-600">×</button>}</div>{payment.forma === "dinheiro" && <div className="mt-2"><input aria-label="Valor recebido em dinheiro" value={payment.recebido || ""} onChange={event => updatePayment(payment.id, { recebido: Number(event.target.value) })} type="number" min={payment.valor} step="0.01" placeholder="Valor recebido" className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" /></div>}{payment.forma === "crediario" && <p className="mt-2 text-xs text-amber-700">Exige cliente e será lançado em contas a receber.</p>}</div>)}</div>
      {payments.length > 1 && <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${remaining === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{remaining > 0 ? `Falta distribuir R$ ${remaining.toFixed(2)}` : remaining < 0 ? `Excedente de R$ ${Math.abs(remaining).toFixed(2)}` : "Pagamento distribuído corretamente"}</p>}
      {cashReceived > 0 && <p className="mt-2 text-sm text-stone-600">Troco: <strong>R$ {Math.max(money(cashReceived - cashAllocated), 0).toFixed(2)}</strong></p>}
      <button disabled={!items.length || total <= 0 || remaining !== 0 || !validPayments} className="mt-3 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Concluir venda</button>
    </form>
  </div>;
}
