import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { PrintButton } from "./print-button";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export async function ImprimirPedidoCompraContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const { data: pedido } = await supabase.from("del_pedidos_compra")
    .select("id, numero, status, observacao, created_at, emitido_em, fornecedor_id")
    .eq("id", id).eq("owner_id", restaurantOwnerId).maybeSingle();
  if (!pedido) notFound();

  const [{ data: fornecedor }, { data: itens }, { data: identidade }] = await Promise.all([
    supabase.from("del_fornecedores").select("razao_social, nome_fantasia, documento").eq("id", pedido.fornecedor_id).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_pedidos_compra_itens").select("descricao_snapshot, unidade_snapshot, quantidade, custo_unitario_estimado").eq("pedido_compra_id", pedido.id).eq("owner_id", restaurantOwnerId),
    supabase.from("restaurants").select("name").eq("owner_user_id", restaurantOwnerId).maybeSingle(),
  ]);
  const total = (itens ?? []).reduce((sum, item) => sum + Number(item.quantidade) * Number(item.custo_unitario_estimado ?? 0), 0);

  return <main className="mx-auto max-w-4xl bg-white p-8 text-stone-900 print:max-w-none print:p-0">
    <div className="mb-6 flex justify-end print:hidden"><PrintButton /></div>
    <header className="border-b-2 border-stone-900 pb-5"><p className="text-sm uppercase tracking-widest text-stone-500">Pedido de compra</p><div className="mt-2 flex justify-between gap-5"><div><h1 className="text-2xl font-bold">{identidade?.name || "Restaurante"}</h1><p className="mt-1 text-sm">Fornecedor: {fornecedor?.nome_fantasia || fornecedor?.razao_social}</p><p className="text-sm">Documento: {fornecedor?.documento || "—"}</p></div><div className="text-right"><p className="text-xl font-bold">#{pedido.numero}</p><p className="text-sm">{new Date(pedido.emitido_em || pedido.created_at).toLocaleDateString("pt-BR")}</p><p className="text-xs uppercase">{pedido.status}</p></div></div></header>
    <table className="mt-7 w-full text-left text-sm"><thead className="border-b border-stone-400"><tr><th className="py-2">Material</th><th className="py-2 text-right">Quantidade</th><th className="py-2 text-right">Custo estimado</th><th className="py-2 text-right">Subtotal</th></tr></thead><tbody className="divide-y divide-stone-200">{(itens ?? []).map((item, index) => { const subtotal = Number(item.quantidade) * Number(item.custo_unitario_estimado ?? 0); return <tr key={`${item.descricao_snapshot}-${index}`}><td className="py-3">{item.descricao_snapshot}</td><td className="py-3 text-right">{Number(item.quantidade)} {item.unidade_snapshot}</td><td className="py-3 text-right">{item.custo_unitario_estimado == null ? "A cotar" : money(Number(item.custo_unitario_estimado))}</td><td className="py-3 text-right">{item.custo_unitario_estimado == null ? "—" : money(subtotal)}</td></tr>; })}</tbody><tfoot className="border-t-2 border-stone-900"><tr><td colSpan={3} className="py-3 text-right font-semibold">Total estimado</td><td className="py-3 text-right font-bold">{money(total)}</td></tr></tfoot></table>
    {pedido.observacao && <section className="mt-6 rounded-lg border border-stone-300 p-4"><h2 className="text-sm font-semibold">Observações</h2><p className="mt-1 whitespace-pre-wrap text-sm">{pedido.observacao}</p></section>}
    <footer className="mt-16 grid grid-cols-2 gap-12 text-center text-xs text-stone-500"><div className="border-t border-stone-500 pt-2">Responsável pela compra</div><div className="border-t border-stone-500 pt-2">Fornecedor</div></footer>
  </main>;
}

export default async function ImprimirPedidoCompraLegacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/restaurante/compras/pedidos/${id}/imprimir`);
}
