import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { PrintButton } from "./print-button";
import { enviarPedidoCompraEmail } from "../../actions";

function moneyBr(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function moneyIt(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

const CONTEUDO: Record<RestauranteLocale, {
  rotulo: string; emailPlaceholder: string; enviarEmail: string; fornecedorLabel: string; documentoLabel: string;
  restauranteFallback: string; colMaterial: string; colQuantidade: string; colCustoEstimado: string; colSubtotal: string;
  aCotar: string; totalEstimado: string; observacoes: string; responsavel: string; fornecedorRodape: string;
}> = {
  "pt-BR": {
    rotulo: "Pedido de compra", emailPlaceholder: "E-mail do fornecedor", enviarEmail: "Enviar por e-mail",
    fornecedorLabel: "Fornecedor:", documentoLabel: "Documento:", restauranteFallback: "Restaurante",
    colMaterial: "Material", colQuantidade: "Quantidade", colCustoEstimado: "Custo estimado", colSubtotal: "Subtotal",
    aCotar: "A cotar", totalEstimado: "Total estimado", observacoes: "Observações",
    responsavel: "Responsável pela compra", fornecedorRodape: "Fornecedor",
  },
  it: {
    rotulo: "Ordine di acquisto", emailPlaceholder: "E-mail del fornitore", enviarEmail: "Invia per e-mail",
    fornecedorLabel: "Fornitore:", documentoLabel: "Documento:", restauranteFallback: "Ristorante",
    colMaterial: "Materiale", colQuantidade: "Quantità", colCustoEstimado: "Costo stimato", colSubtotal: "Subtotale",
    aCotar: "Da quotare", totalEstimado: "Totale stimato", observacoes: "Note",
    responsavel: "Responsabile dell'acquisto", fornecedorRodape: "Fornitore",
  },
};

export async function ImprimirPedidoCompraContent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sucesso?: string; erro?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("compras");
  const t = CONTEUDO[locale];
  const money = locale === "it" ? moneyIt : moneyBr;
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const { data: pedido } = await supabase.from("del_pedidos_compra")
    .select("id, numero, numero_controle, status, observacao, created_at, emitido_em, fornecedor_id")
    .eq("id", id).eq("owner_id", restaurantOwnerId).maybeSingle();
  if (!pedido) notFound();

  const [{ data: fornecedor }, { data: itens }, { data: identidade }] = await Promise.all([
    supabase.from("del_fornecedores").select("razao_social, nome_fantasia, documento, email").eq("id", pedido.fornecedor_id).eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_pedidos_compra_itens").select("descricao_snapshot, unidade_snapshot, quantidade, custo_unitario_estimado").eq("pedido_compra_id", pedido.id).eq("owner_id", restaurantOwnerId),
    supabase.from("restaurants").select("name").eq("owner_user_id", restaurantOwnerId).maybeSingle(),
  ]);
  const total = (itens ?? []).reduce((sum, item) => sum + Number(item.quantidade) * Number(item.custo_unitario_estimado ?? 0), 0);

  return <main className="mx-auto max-w-4xl bg-white p-8 text-stone-900 print:max-w-none print:p-0">
    <div className="mb-6 flex flex-wrap items-center justify-end gap-2 print:hidden"><form action={enviarPedidoCompraEmail.bind(null, pedido.id)} className="flex flex-wrap gap-2"><input name="email" type="email" required defaultValue={fornecedor?.email ?? ""} placeholder={t.emailPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><button className="rounded-md border border-stone-900 px-4 py-2 text-sm font-medium">{t.enviarEmail}</button></form><PrintButton /></div>
    {query.sucesso && <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 print:hidden">{query.sucesso}</p>}
    {query.erro && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 print:hidden">{query.erro}</p>}
    <header className="border-b-2 border-stone-900 pb-5"><p className="text-sm uppercase tracking-widest text-stone-500">{t.rotulo}</p><div className="mt-2 flex justify-between gap-5"><div><h1 className="text-2xl font-bold">{identidade?.name || t.restauranteFallback}</h1><p className="mt-1 text-sm">{t.fornecedorLabel} {fornecedor?.nome_fantasia || fornecedor?.razao_social}</p><p className="text-sm">{t.documentoLabel} {fornecedor?.documento || "—"}</p></div><div className="text-right"><p className="text-xl font-bold">{pedido.numero_controle || `#${pedido.numero}`}</p><p className="text-sm">{new Date(pedido.emitido_em || pedido.created_at).toLocaleDateString(intlLocale)}</p><p className="text-xs uppercase">{pedido.status}</p></div></div></header>
    <table className="mt-7 w-full text-left text-sm"><thead className="border-b border-stone-400"><tr><th className="py-2">{t.colMaterial}</th><th className="py-2 text-right">{t.colQuantidade}</th><th className="py-2 text-right">{t.colCustoEstimado}</th><th className="py-2 text-right">{t.colSubtotal}</th></tr></thead><tbody className="divide-y divide-stone-200">{(itens ?? []).map((item, index) => { const subtotal = Number(item.quantidade) * Number(item.custo_unitario_estimado ?? 0); return <tr key={`${item.descricao_snapshot}-${index}`}><td className="py-3">{item.descricao_snapshot}</td><td className="py-3 text-right">{Number(item.quantidade)} {item.unidade_snapshot}</td><td className="py-3 text-right">{item.custo_unitario_estimado == null ? t.aCotar : money(Number(item.custo_unitario_estimado))}</td><td className="py-3 text-right">{item.custo_unitario_estimado == null ? "—" : money(subtotal)}</td></tr>; })}</tbody><tfoot className="border-t-2 border-stone-900"><tr><td colSpan={3} className="py-3 text-right font-semibold">{t.totalEstimado}</td><td className="py-3 text-right font-bold">{money(total)}</td></tr></tfoot></table>
    {pedido.observacao && <section className="mt-6 rounded-lg border border-stone-300 p-4"><h2 className="text-sm font-semibold">{t.observacoes}</h2><p className="mt-1 whitespace-pre-wrap text-sm">{pedido.observacao}</p></section>}
    <footer className="mt-16 grid grid-cols-2 gap-12 text-center text-xs text-stone-500"><div className="border-t border-stone-500 pt-2">{t.responsavel}</div><div className="border-t border-stone-500 pt-2">{t.fornecedorRodape}</div></footer>
  </main>;
}

export default async function ImprimirPedidoCompraLegacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/restaurante/compras/pedidos/${id}/imprimir`);
}
