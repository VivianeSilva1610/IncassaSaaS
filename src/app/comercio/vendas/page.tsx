import Link from "next/link";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { cancelarVendaComercial } from "../actions";

export default async function VendasPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const { supabase, business } = await requireCommerceAccess("vendas");
  if (!business) return null;
  const messages = await searchParams;
  const { data: sales } = await supabase.from("commerce_sales")
    .select("id,numero,status,subtotal,desconto,total,valor_pago,created_at,commerce_sale_items(id),commerce_customers(nome)")
    .eq("business_id", business.id).order("created_at", { ascending: false }).limit(100);

  return <div><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Operação</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-950">Vendas</h1></div><Link href="/comercio/vendas/nova" className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">+ Nova venda</Link></div>
    {messages.erro && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{messages.erro}</p>}{messages.sucesso && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{messages.sucesso}</p>}
    <div className="mt-6 space-y-3">{(sales ?? []).map(sale => {
      const customer = Array.isArray(sale.commerce_customers) ? sale.commerce_customers[0] : sale.commerce_customers;
      return <div key={sale.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5"><div><Link href={`/comercio/vendas/${sale.id}`} className="font-semibold text-stone-900 hover:text-amber-700">Venda #{sale.numero}</Link><p className="mt-1 text-xs text-stone-500">{new Date(sale.created_at).toLocaleString("pt-BR")} · {sale.commerce_sale_items?.length ?? 0} itens · {customer?.nome ?? "Consumidor não identificado"}</p>{Number(sale.desconto) > 0 && <p className="mt-1 text-xs text-amber-700">Subtotal R$ {Number(sale.subtotal).toFixed(2)} · desconto R$ {Number(sale.desconto).toFixed(2)}</p>}</div><div className="flex items-center gap-4"><div className="text-right"><p className="font-bold">R$ {Number(sale.total).toFixed(2)}</p><p className="text-xs text-stone-500">Recebido: R$ {Number(sale.valor_pago).toFixed(2)}</p><p className="mt-1 text-xs uppercase text-stone-500">{sale.status}</p></div><Link href={`/comercio/vendas/${sale.id}`} className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700">Detalhes</Link>{sale.status === "concluida" && <form action={cancelarVendaComercial.bind(null, sale.id)}><button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Cancelar</button></form>}</div></div>;
    })}{!sales?.length && <p className="rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">Nenhuma venda registrada.</p>}</div>
  </div>;
}
