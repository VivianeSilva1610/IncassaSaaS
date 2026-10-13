import Link from "next/link";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { importarNfeComercio } from "../actions";
import { CommercePurchaseForm } from "@/components/comercio/CommercePurchaseForm";

export default async function EntradasPage({searchParams}:{searchParams:Promise<{erro?:string;sucesso?:string}>}) {
  const { supabase, business } = await requireCommerceAccess("compras"); if (!business) return null;
  const messages = await searchParams;
  const [{data:products},{data:suppliers},{data:entries},{data:purchaseOrders}] = await Promise.all([
    supabase.from("commerce_products").select("id,nome,sku,custo_medio").eq("business_id",business.id).eq("ativo",true).order("nome"),
    supabase.from("commerce_suppliers").select("id,nome").eq("business_id",business.id).eq("ativo",true).order("nome"),
    supabase.from("commerce_stock_entries").select("id,origem,status,numero_documento,valor_total,created_at,commerce_suppliers(nome)").eq("business_id",business.id).order("created_at",{ascending:false}).limit(100),
    supabase.from("commerce_purchase_orders").select("id,numero,status,commerce_suppliers(nome)").eq("business_id",business.id).in("status",["aberto","parcial"]).order("created_at",{ascending:false}),
  ]);
  return <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/comercio" className="text-sm font-medium text-amber-700">← Visão geral</Link><h1 className="mt-2 text-3xl font-bold text-stone-950">Entradas de mercadoria</h1><p className="mt-1 text-sm text-stone-500">Nada altera o estoque antes da conferência e efetivação.</p>
    {messages.erro&&<p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{messages.erro}</p>}{messages.sucesso&&<p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{messages.sucesso}</p>}
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><CommercePurchaseForm products={products??[]} suppliers={suppliers??[]}/><form action={importarNfeComercio} className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-semibold text-stone-900">Importar NF-e</h2><p className="mt-1 text-xs text-stone-500">XML autorizado, modelo 55, com até 5 MB.</p><select name="purchase_order_id" className="mt-5 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"><option value="">Sem pedido de compra vinculado</option>{(purchaseOrders??[]).map(order=><option key={order.id} value={order.id}>PC-{order.numero} · {order.commerce_suppliers?.[0]?.nome??"Fornecedor"} · {order.status}</option>)}</select><input name="xml" type="file" accept=".xml,text/xml,application/xml" required className="mt-3 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"/><button className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-stone-950">Ler XML e conferir itens</button></form></div>
    <div className="mt-7 space-y-3"><h2 className="font-semibold text-stone-900">Histórico</h2>{(entries??[]).map(entry=><Link key={entry.id} href={`/comercio/entradas/${entry.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-4 hover:border-amber-300"><div><p className="font-semibold text-stone-800">{entry.origem==="nfe_xml"?"NF-e":entry.origem==="pedido_compra"?"Pedido de compra":"Compra manual"} {entry.numero_documento||"sem número"}</p><p className="text-xs text-stone-500">{new Date(entry.created_at).toLocaleDateString("pt-BR")}</p></div><div className="text-right"><p className="font-semibold">R$ {Number(entry.valor_total).toFixed(2)}</p><p className="text-xs uppercase text-amber-700">{entry.status}</p></div></Link>)}{!entries?.length&&<p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">Nenhuma entrada registrada.</p>}</div>
  </div></main>;
}
