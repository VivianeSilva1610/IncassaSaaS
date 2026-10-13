import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { CommercePrintButton } from "@/components/comercio/CommercePrintButton";
import { CommerceReturnForm } from "@/components/comercio/CommerceReturnForm";

const paymentLabels: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", debito: "Cartão de débito", credito: "Cartão de crédito", boleto: "Boleto", crediario: "Crediário", outro: "Outro" };

export default async function VendaDetalhePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sucesso?: string; erro?: string }> }) {
  const { id } = await params; const messages = await searchParams;
  const { supabase, business } = await requireCommerceAccess("vendas"); if (!business) return null;
  const [{ data: sale }, { data: items }, { data: payments }, { data: returns }, { data: returnedItems }] = await Promise.all([
    supabase.from("commerce_sales").select("id,numero,status,subtotal,desconto,total,valor_pago,competencia_em,pago_em,created_at,commerce_customers(nome,documento,email,telefone)").eq("id", id).eq("business_id", business.id).maybeSingle(),
    supabase.from("commerce_sale_items").select("id,product_id,descricao,quantidade,preco_unitario,total").eq("sale_id", id).eq("business_id", business.id).order("created_at"),
    supabase.from("commerce_sale_payments").select("id,forma,valor,status,confirmado_em").eq("sale_id", id).eq("business_id", business.id).order("created_at"),
    supabase.from("commerce_sale_returns").select("id,motivo,valor,reembolso_forma,reembolso_status,created_at").eq("sale_id", id).eq("business_id", business.id).order("created_at", { ascending: false }),
    supabase.from("commerce_sale_return_items").select("sale_item_id,quantidade").eq("sale_id", id).eq("business_id", business.id),
  ]);
  if (!sale) notFound();
  const customer = sale.commerce_customers?.[0];
  const returned = new Map<string, number>();
  for (const row of returnedItems ?? []) returned.set(row.sale_item_id, (returned.get(row.sale_item_id) ?? 0) + Number(row.quantidade));
  const available = (items ?? []).map(item => ({ id: item.id, descricao: item.descricao, disponivel: Number(item.quantidade) - (returned.get(item.id) ?? 0) })).filter(item => item.disponivel > 0);
  const returnedTotal = (returns ?? []).reduce((sum, row) => sum + Number(row.valor), 0);
  return <div><style>{`@media print { body * { visibility: hidden !important; } #commerce-receipt, #commerce-receipt * { visibility: visible !important; } #commerce-receipt { position: absolute; inset: 0; width: 100%; padding: 24px; } }`}</style>
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link href="/comercio/vendas" className="text-sm font-semibold text-amber-700">← Vendas</Link><CommercePrintButton /></div>
    {messages.sucesso && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 print:hidden">{messages.sucesso}</p>}{messages.erro && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 print:hidden">{messages.erro}</p>}
    <article id="commerce-receipt" className="mt-5 rounded-2xl border border-stone-200 bg-white p-6"><header className="flex flex-wrap justify-between gap-4 border-b border-stone-200 pb-5"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">{business.nome_fantasia || business.nome}</p><h1 className="mt-1 text-2xl font-bold text-stone-950">Comprovante da venda #{sale.numero}</h1><p className="mt-1 text-sm text-stone-500">{new Date(sale.competencia_em || sale.created_at).toLocaleString("pt-BR")} · {sale.status.replaceAll("_", " ")}</p></div><div className="text-right"><p className="text-sm text-stone-500">Total líquido</p><p className="text-2xl font-bold">R$ {(Number(sale.total) - returnedTotal).toFixed(2)}</p>{returnedTotal > 0 && <p className="text-xs text-red-700">Devolvido: R$ {returnedTotal.toFixed(2)}</p>}</div></header>
      <section className="py-5"><h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Cliente</h2><p className="mt-2 font-medium">{customer?.nome || "Consumidor não identificado"}</p>{customer?.documento && <p className="text-sm text-stone-500">Documento: {customer.documento}</p>}</section>
      <section className="overflow-hidden rounded-xl border border-stone-200"><div className="grid grid-cols-[1fr_80px_110px] bg-stone-50 px-4 py-2 text-xs font-semibold uppercase text-stone-500"><span>Item</span><span className="text-right">Qtd.</span><span className="text-right">Total</span></div>{(items ?? []).map(item => <div key={item.id} className="grid grid-cols-[1fr_80px_110px] border-t border-stone-100 px-4 py-3 text-sm"><div><p className="font-medium">{item.descricao}</p><p className="text-xs text-stone-500">R$ {Number(item.preco_unitario).toFixed(2)} un.</p>{(returned.get(item.id) ?? 0) > 0 && <p className="text-xs text-red-700">Devolvido: {returned.get(item.id)}</p>}</div><span className="text-right">{Number(item.quantidade)}</span><span className="text-right font-medium">R$ {Number(item.total).toFixed(2)}</span></div>)}</section>
      <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm"><div className="flex justify-between text-stone-500"><span>Subtotal</span><span>R$ {Number(sale.subtotal).toFixed(2)}</span></div><div className="flex justify-between text-stone-500"><span>Desconto</span><span>− R$ {Number(sale.desconto).toFixed(2)}</span></div><div className="flex justify-between border-t pt-2 font-bold"><span>Total original</span><span>R$ {Number(sale.total).toFixed(2)}</span></div></div>
      <section className="mt-6 border-t border-stone-200 pt-5"><h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Pagamentos</h2><div className="mt-2 flex flex-wrap gap-2">{(payments ?? []).map(payment => <span key={payment.id} className="rounded-lg bg-stone-100 px-3 py-2 text-sm">{paymentLabels[payment.forma] || payment.forma}: R$ {Number(payment.valor).toFixed(2)} · {payment.status}</span>)}</div></section>
      <p className="mt-6 text-center text-xs text-stone-400">Comprovante não fiscal. Documento fiscal, quando aplicável, é emitido separadamente.</p>
    </article>
    {!!returns?.length && <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 print:hidden"><h2 className="font-semibold">Histórico de devoluções</h2><div className="mt-3 divide-y">{returns.map(row => <div key={row.id} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{row.motivo}</p><p className="text-xs text-stone-500">{new Date(row.created_at).toLocaleString("pt-BR")} · Reembolso {row.reembolso_status}{row.reembolso_forma ? ` por ${paymentLabels[row.reembolso_forma] || row.reembolso_forma}` : ""}</p></div><p className="font-semibold text-red-700">R$ {Number(row.valor).toFixed(2)}</p></div>)}</div></section>}
    {available.length > 0 && ["concluida", "devolvida_parcial"].includes(sale.status) && <div className="mt-5"><CommerceReturnForm saleId={sale.id} items={available} /></div>}
  </div>;
}
