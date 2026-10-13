import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { cancelarPedidoVendaComercio } from "../../../actions";
import { CommerceOrderBillingForm } from "@/components/comercio/CommerceOrderBillingForm";

export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{erro?:string;sucesso?:string}>}) {
  const { id } = await params; const msg = await searchParams;
  const { supabase, business } = await requireCommerceAccess("vendas"); if (!business) return null;
  const [{data:order},{data:items},{data:reserves}] = await Promise.all([
    supabase.from("commerce_sales_orders").select("id,numero,status,reserva_ate,total,observacoes,sale_id,customer_id,commerce_customers(nome)").eq("id",id).eq("business_id",business.id).maybeSingle(),
    supabase.from("commerce_sales_order_items").select("id,descricao,quantidade,total").eq("order_id",id).eq("business_id",business.id),
    supabase.from("commerce_stock_reservations").select("id,quantidade,status,expires_at").eq("order_id",id).eq("business_id",business.id),
  ]);
  if (!order) notFound();
  const active = (reserves??[]).filter(row=>row.status==="ativa");
  const canBill = ["aberto","separacao","pronto"].includes(order.status) && active.length === (items??[]).length && (!order.reserva_ate || new Date(order.reserva_ate)>new Date());
  return <div><Link href="/comercio/vendas/pedidos" className="text-sm font-semibold text-amber-700">← Pedidos</Link><h1 className="mt-2 text-3xl font-bold">Pedido PV-{order.numero}</h1><p className="text-sm text-stone-500">{order.commerce_customers?.[0]?.nome??"Consumidor"} · {order.status}</p>
    {msg.erro&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{msg.erro}</p>}{msg.sucesso&&<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-700">{msg.sucesso}</p>}
    <section className="mt-5 rounded-2xl border bg-white p-5">{(items??[]).map(item=><div key={item.id} className="flex justify-between border-b py-2 text-sm"><span>{item.descricao} · {Number(item.quantidade)}</span><span>R$ {Number(item.total).toFixed(2)}</span></div>)}<p className="mt-4 text-right text-xl font-bold">Total R$ {Number(order.total).toFixed(2)}</p><p className="mt-2 text-xs text-stone-500">Reservas ativas: {active.length}{order.reserva_ate?` · até ${new Date(order.reserva_ate).toLocaleString("pt-BR")}`:""}</p></section>
    {order.sale_id&&<Link href={`/comercio/vendas/${order.sale_id}`} className="mt-4 block rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-800">Abrir venda faturada</Link>}
    {canBill&&<CommerceOrderBillingForm orderId={id} total={Number(order.total)} hasCustomer={Boolean(order.customer_id)}/>} {!canBill&&["aberto","separacao","pronto"].includes(order.status)&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">A reserva venceu ou está incompleta; este pedido não pode ser faturado.</p>}
    {["aberto","separacao","pronto"].includes(order.status)&&<form action={cancelarPedidoVendaComercio.bind(null,id)} className="mt-4"><button className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm font-semibold text-red-700">Cancelar pedido e liberar reserva</button></form>}
  </div>;
}
