import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { CommerceSupplierReturnForm } from "@/components/comercio/CommerceSupplierReturnForm";
import { cancelarEntradaComercio, efetivarEntrada } from "../../actions";

export default async function ConferirEntradaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const { id } = await params;
  const messages = await searchParams;
  const { supabase, business } = await requireCommerceAccess("compras");
  if (!business) return null;

  const [{ data: entry }, { data: items }, { data: products }, { data: payables }, { data: returns }] = await Promise.all([
    supabase.from("commerce_stock_entries").select("id, origem, status, purchase_order_id, numero_documento, valor_produtos, valor_frete, valor_desconto, valor_total, chave_acesso_nfe, observacoes, commerce_suppliers(nome)").eq("id", id).eq("business_id", business.id).maybeSingle(),
    supabase.from("commerce_stock_entry_items").select("id, product_id, variant_id, descricao_documento, codigo_fornecedor, gtin_documento, quantidade, unidade, valor_unitario, valor_total, ncm_documento, cfop_documento").eq("entry_id", id).eq("business_id", business.id).order("created_at"),
    supabase.from("commerce_products").select("id, nome, sku, gtin, controla_lote, controla_validade, commerce_product_variants(id,nome,cor,tamanho,sku,gtin,ativo)").eq("business_id", business.id).eq("ativo", true).order("nome"),
    supabase.from("commerce_accounts_payable").select("id,valor,valor_pago,vencimento,status").eq("entry_id", id).eq("business_id", business.id).order("vencimento"),
    supabase.from("commerce_supplier_returns").select("id,motivo,valor_produtos,valor_compensado,credito_fornecedor,status_financeiro,created_at,commerce_supplier_return_items(entry_item_id,quantidade)").eq("entry_id", id).eq("business_id", business.id).order("created_at", { ascending: false }),
  ]);
  if (!entry) notFound();
  const { data: purchaseOrder } = entry.purchase_order_id ? await supabase.from("commerce_purchase_orders").select("id,numero,status,commerce_purchase_order_items(descricao,quantidade_pedida,quantidade_recebida)").eq("id",entry.purchase_order_id).eq("business_id",business.id).maybeSingle() : { data: null };

  const returnedByItem = new Map<string, number>();
  for (const supplierReturn of returns ?? []) for (const item of supplierReturn.commerce_supplier_return_items ?? []) returnedByItem.set(item.entry_item_id, (returnedByItem.get(item.entry_item_id) ?? 0) + Number(item.quantidade));
  const available = (items ?? []).filter(item => item.product_id && Number(item.quantidade) > (returnedByItem.get(item.id) ?? 0)).map(item => ({ id: item.id, descricao: item.descricao_documento, unidade: item.unidade, disponivel: Number(item.quantidade) - (returnedByItem.get(item.id) ?? 0) }));
  const canEdit = ["rascunho", "conferida"].includes(entry.status);
  const entryLabel = entry.origem === "nfe_xml" ? `NF-e ${entry.numero_documento}` : entry.origem === "pedido_compra" ? `Pedido de compra ${entry.numero_documento}` : "Compra manual";

  return <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/comercio/entradas" className="text-sm font-medium text-amber-700">← Entradas</Link>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold text-stone-950">Conferir entrada</h1><p className="text-sm text-stone-500">{entryLabel} · R$ {Number(entry.valor_total).toFixed(2)}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">{entry.status}</span></div>
    {messages.erro && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{messages.erro}</p>}{messages.sucesso && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{messages.sucesso}</p>}
    {purchaseOrder&&<section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-stone-900">Vinculada ao pedido PC-{purchaseOrder.numero}</p><p className="text-xs text-stone-600">O pedido será atualizado somente após efetivar esta entrada.</p></div><Link href={`/comercio/pedidos-compra/${purchaseOrder.id}`} className="text-sm font-semibold text-amber-800">Abrir pedido</Link></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{(purchaseOrder.commerce_purchase_order_items??[]).map((item,index)=><div key={index} className="rounded-lg bg-white/70 p-2 text-xs text-stone-700">{item.descricao}: {Number(item.quantidade_recebida)} de {Number(item.quantidade_pedida)}</div>)}</div></section>}

    <form action={efetivarEntrada.bind(null, entry.id)} className="mt-6 space-y-3">{(items ?? []).map(item => { const suggested = products?.find(product => (item.gtin_documento && product.gtin === item.gtin_documento) || product.id === item.product_id); const defaultProduct = item.variant_id && item.product_id ? `${item.product_id}|${item.variant_id}` : suggested?.id || ""; return <div key={item.id} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 md:grid-cols-[1fr_300px]"><div><p className="font-semibold text-stone-900">{item.descricao_documento}</p><p className="mt-1 text-xs text-stone-500">{Number(item.quantidade)} {item.unidade} × R$ {Number(item.valor_unitario).toFixed(4)} · NCM {item.ncm_documento || "não informado"} · CFOP {item.cfop_documento || "não informado"}</p></div><div className="space-y-2"><select name={`product_${item.id}`} defaultValue={defaultProduct} required disabled={!canEdit} className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm"><option value="">Vincular ao produto…</option>{(products ?? []).map(product => <optgroup key={product.id} label={product.nome}><option value={product.id}>{product.nome}{product.sku ? ` · ${product.sku}` : ""}</option>{(product.commerce_product_variants??[]).filter(v=>v.ativo).map(v=><option key={v.id} value={`${product.id}|${v.id}`}>↳ {v.nome}{v.cor?` · ${v.cor}`:""}{v.tamanho?` · ${v.tamanho}`:""}</option>)}</optgroup>)}</select>{canEdit&&<div className="grid grid-cols-2 gap-2"><input name={`lote_${item.id}`} placeholder="Lote opcional" className="rounded-lg border px-2 py-2 text-xs"/><input name={`validade_${item.id}`} type="date" title="Validade opcional" className="rounded-lg border px-2 py-2 text-xs"/></div>}</div></div>})}
      {canEdit && <button className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white">Confirmar e atualizar estoque</button>}
    </form>

    {canEdit && <form action={cancelarEntradaComercio.bind(null, entry.id)} className="mt-3"><button className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">Cancelar compra sem movimentar estoque</button></form>}

    <section className="mt-5 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2"><div><h2 className="font-semibold text-stone-900">Resumo da compra</h2><p className="mt-2 text-sm text-stone-600">Fornecedor: {entry.commerce_suppliers?.[0]?.nome || "não informado"}</p><p className="text-sm text-stone-600">Produtos: R$ {Number(entry.valor_produtos).toFixed(2)} · Frete: R$ {Number(entry.valor_frete).toFixed(2)} · Desconto: R$ {Number(entry.valor_desconto).toFixed(2)}</p>{entry.observacoes && <p className="mt-2 text-sm text-stone-500">{entry.observacoes}</p>}</div><div><h2 className="font-semibold text-stone-900">Contas a pagar</h2>{(payables ?? []).map(payable => <p key={payable.id} className="mt-2 text-sm text-stone-600">{new Date(`${payable.vencimento}T12:00:00`).toLocaleDateString("pt-BR")} · R$ {Number(payable.valor_pago).toFixed(2)} pago de R$ {Number(payable.valor).toFixed(2)} · {payable.status}</p>)}{!payables?.length && <p className="mt-2 text-sm text-stone-500">Nenhuma parcela gerada.</p>}</div></section>

    {entry.status === "efetivada" && available.length > 0 && <div className="mt-5"><CommerceSupplierReturnForm entryId={entry.id} items={available} /></div>}
    {(returns ?? []).length > 0 && <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-semibold text-stone-900">Histórico de devoluções</h2><div className="mt-3 space-y-3">{(returns ?? []).map(row => <div key={row.id} className="rounded-xl bg-stone-50 p-3 text-sm text-stone-700"><p className="font-medium">{new Date(row.created_at).toLocaleString("pt-BR")} · R$ {Number(row.valor_produtos).toFixed(2)}</p><p className="mt-1">{row.motivo}</p><p className="mt-1 text-xs text-stone-500">Compensado: R$ {Number(row.valor_compensado).toFixed(2)} · Crédito pendente: R$ {Number(row.credito_fornecedor).toFixed(2)}</p></div>)}</div></section>}
    {!products?.length && canEdit && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Cadastre os produtos antes de efetivar. <Link href="/comercio/produtos" className="font-semibold underline">Abrir catálogo</Link></p>}
  </div></main>;
}
