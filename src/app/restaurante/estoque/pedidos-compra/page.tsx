import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { alterarStatusPedidoCompra, criarPedidoCompra } from "./actions";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const statusLabels: Record<string, string> = { rascunho: "Rascunho", emitido: "Emitido", recebido: "Recebido", cancelado: "Cancelado" };

export async function PedidosCompraContent({ searchParams }: { searchParams: Promise<{ sucesso?: string; erro?: string }> }) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const params = await searchParams;
  const [{ data: fornecedores }, { data: ingredientes }, { data: pedidos }] = await Promise.all([
    supabase.from("del_fornecedores").select("id, razao_social, nome_fantasia").eq("owner_id", restaurantOwnerId).order("razao_social"),
    supabase.from("del_ingredients").select("id, nome, unidade, quantidade_atual, estoque_minimo, custo_unitario").eq("owner_id", restaurantOwnerId).order("nome"),
    supabase.from("del_pedidos_compra").select("id, numero, numero_controle, status, observacao, created_at, fornecedor_id").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }).limit(100),
  ]);
  const pedidoIds = (pedidos ?? []).map((pedido) => pedido.id);
  const { data: itens } = pedidoIds.length
    ? await supabase.from("del_pedidos_compra_itens").select("pedido_compra_id, descricao_snapshot, unidade_snapshot, quantidade, custo_unitario_estimado").eq("owner_id", restaurantOwnerId).in("pedido_compra_id", pedidoIds)
    : { data: [] };

  return <div>
    <Link href="/restaurante/compras" className="text-sm text-amber-700 underline underline-offset-2">← Compras</Link>
    <h1 className="mt-2 text-2xl font-bold text-stone-900">Pedidos de compra</h1>
    <p className="mt-1 text-sm text-stone-600">Planeje a reposição antes da compra. O pedido não movimenta estoque e não cria conta a pagar; isso ocorre somente no recebimento da NF-e.</p>
    {params.sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.sucesso}</p>}
    {params.erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.erro}</p>}

    <form action={criarPedidoCompra} className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="font-semibold text-stone-900">Novo pedido</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-stone-600">Fornecedor<select name="fornecedor_id" required defaultValue="" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900"><option value="">Selecione...</option>{(fornecedores ?? []).map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_fantasia || fornecedor.razao_social}</option>)}</select></label>
        <label className="text-sm text-stone-600">Observação<input name="observacao" maxLength={1000} placeholder="Prazo, contato ou instruções" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900" /></label>
      </div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b text-xs uppercase text-stone-500"><tr><th className="p-2">Comprar</th><th className="p-2">Material</th><th className="p-2">Saldo / mínimo</th><th className="p-2">Quantidade pedida</th></tr></thead><tbody className="divide-y divide-stone-100">{(ingredientes ?? []).map((item) => { const baixo = item.estoque_minimo != null && Number(item.quantidade_atual) <= Number(item.estoque_minimo); const sugestao = Math.max(Number(item.estoque_minimo ?? 0) - Number(item.quantidade_atual), 1); return <tr key={item.id} className={baixo ? "bg-amber-50" : ""}><td className="p-2"><input type="checkbox" name={`selecionar_${item.id}`} /></td><td className="p-2"><span className="font-medium text-stone-900">{item.nome}</span>{baixo && <span className="ml-2 text-xs text-amber-700">estoque baixo</span>}</td><td className="p-2 text-stone-600">{Number(item.quantidade_atual)} / {item.estoque_minimo == null ? "—" : Number(item.estoque_minimo)} {item.unidade}</td><td className="p-2"><input name={`quantidade_${item.id}`} type="number" min="0.0001" step="0.0001" defaultValue={sugestao} className="w-32 rounded-md border border-stone-300 px-2 py-1" /> <span className="text-xs text-stone-500">{item.unidade}</span></td></tr>; })}</tbody></table></div>
      <button className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Criar rascunho</button>
    </form>

    <div className="mt-7 space-y-3"><h2 className="font-semibold text-stone-900">Pedidos emitidos e rascunhos</h2>{(pedidos ?? []).map((pedido) => { const fornecedor = (fornecedores ?? []).find((item) => item.id === pedido.fornecedor_id); const linhas = (itens ?? []).filter((item) => item.pedido_compra_id === pedido.id); const estimado = linhas.reduce((total, item) => total + Number(item.quantidade) * Number(item.custo_unitario_estimado ?? 0), 0); return <article key={pedido.id} className="rounded-xl border border-stone-200 bg-white p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium text-stone-900">Pedido {pedido.numero_controle || `#${pedido.numero}`} · {fornecedor?.nome_fantasia || fornecedor?.razao_social || "Fornecedor"}</p><p className="text-sm text-stone-500">{new Date(pedido.created_at).toLocaleString("pt-BR")} · {statusLabels[pedido.status] || pedido.status}</p></div><p className="font-semibold text-stone-900">Estimado: {money(estimado)}</p></div><ul className="mt-3 list-inside list-disc text-sm text-stone-700">{linhas.map((item, index) => <li key={`${item.descricao_snapshot}-${index}`}>{Number(item.quantidade)} {item.unidade_snapshot} de {item.descricao_snapshot}</li>)}</ul>{pedido.observacao && <p className="mt-2 text-sm text-stone-500">{pedido.observacao}</p>}<div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">{pedido.status === "emitido" && <Link href={`/restaurante/compras/pedidos/${pedido.id}/imprimir`} target="_blank" className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700">Imprimir / PDF</Link>}{isGerente && pedido.status === "rascunho" && <><form action={alterarStatusPedidoCompra.bind(null, pedido.id, "emitido")}><button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white">Emitir pedido</button></form><form action={alterarStatusPedidoCompra.bind(null, pedido.id, "cancelado")}><button className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700">Cancelar</button></form></>}</div></article>; })}{(pedidos ?? []).length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Nenhum pedido de compra criado.</p>}</div>
  </div>;
}

export default async function PedidosCompraLegacyPage() {
  redirect("/restaurante/compras/pedidos");
}
