import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { criarItemEstoqueNaCompra, processarCompra } from "../actions";
import { DeleteNoteButton } from "./delete-note-button";
import { ItemClassification } from "./item-classification";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const destinationLabels: Record<string, string> = {
  insumo_producao: "Insumo de produção",
  embalagem: "Embalagem",
  mercadoria_revenda: "Mercadoria para revenda",
  uso_consumo: "Uso e consumo",
  ativo_imobilizado: "Ativo imobilizado",
  despesa: "Despesa sem estoque",
};

export default async function CompraDetalhePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sucesso?: string; erro?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const { data: nota } = await supabase
    .from("del_notas_entrada")
    .select("id, numero, serie, chave_acesso, fornecedor_id, fornecedor_nome, fornecedor_documento, destinatario_documento, valor_total, emitida_em, protocolo_autorizacao, status, importada_em")
    .eq("id", id)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  if (!nota) notFound();

  const { data: itens } = await supabase
    .from("del_notas_entrada_itens")
    .select("id, numero_item, codigo_fornecedor, ean, descricao, ncm, cest, cfop, unidade, quantidade, valor_unitario, valor_total, ingrediente_id, quantidade_estoque, destinacao")
    .eq("nota_entrada_id", id)
    .eq("owner_id", restaurantOwnerId)
    .order("numero_item");

  const { data: ingredientes } = await supabase
    .from("del_ingredients")
    .select("id, nome, unidade, quantidade_atual")
    .eq("owner_id", restaurantOwnerId)
    .order("nome");

  const { data: parcelas } = await supabase
    .from("del_notas_entrada_parcelas")
    .select("id, numero, vencimento, valor")
    .eq("nota_entrada_id", id)
    .eq("owner_id", restaurantOwnerId)
    .order("vencimento")
    .order("numero");

  const { data: memorias } = await supabase
    .from("del_fornecedor_produto_mapeamentos")
    .select("codigo_fornecedor, destinacao, ingrediente_id, fator_conversao")
    .eq("owner_id", restaurantOwnerId)
    .eq("fornecedor_id", nota.fornecedor_id);

  // Pedidos de compra emitidos pra esse mesmo fornecedor — pra conferir a
  // NF-e contra o que foi aprovado antes de confirmar o recebimento.
  const { data: pedidosEmitidos } = await supabase
    .from("del_pedidos_compra")
    .select("id, numero_controle")
    .eq("owner_id", restaurantOwnerId)
    .eq("fornecedor_id", nota.fornecedor_id)
    .eq("status", "emitido")
    .order("created_at", { ascending: false });

  const processada = nota.status === "processada";

  return (
    <div>
      <Link href="/restaurante/compras/nfe" className="text-sm text-amber-700 hover:underline">← Voltar para compras</Link>
      {query.sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{query.sucesso}</p>}
      {query.erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.erro}</p>}
      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap justify-between gap-4">
          <div><h1 className="text-xl font-bold text-stone-900">NF-e {nota.numero}{nota.serie ? ` · série ${nota.serie}` : ""}</h1><p className="mt-1 text-sm text-stone-600">{nota.fornecedor_nome} · {nota.fornecedor_documento}</p></div>
          <div className="text-right"><p className="text-xl font-bold text-stone-900">{money(Number(nota.valor_total))}</p><p className="text-xs uppercase text-amber-700">{nota.status}</p></div>
        </div>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-stone-500">Chave de acesso</dt><dd className="break-all font-mono text-xs text-stone-800">{nota.chave_acesso}</dd></div>
          <div><dt className="text-stone-500">Protocolo</dt><dd>{nota.protocolo_autorizacao || "—"}</dd></div>
          <div><dt className="text-stone-500">Emissão</dt><dd>{nota.emitida_em ? new Date(nota.emitida_em).toLocaleString("pt-BR") : "—"}</dd></div>
          <div><dt className="text-stone-500">Destinatário</dt><dd>{nota.destinatario_documento || "Não informado"}</dd></div>
        </dl>
        {(parcelas ?? []).length > 0 && <div className="mt-5 border-t border-stone-100 pt-4"><p className="text-sm font-medium text-stone-900">Parcelas informadas na NF-e</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(parcelas ?? []).map((parcela) => <div key={parcela.id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm"><span className="font-medium">Parcela {parcela.numero}</span><span className="block text-stone-600">{new Date(`${parcela.vencimento}T00:00:00`).toLocaleDateString("pt-BR")} · {money(Number(parcela.valor))}</span></div>)}</div></div>}
        {isGerente && !processada && nota.status !== "cancelada" && <div className="mt-5 border-t border-stone-100 pt-4"><DeleteNoteButton notaId={nota.id} /></div>}
      </div>

      {!processada && isGerente && (
        <details className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-amber-700">Cadastrar item que ainda não existe no estoque</summary>
          <form action={criarItemEstoqueNaCompra.bind(null, nota.id)} className="mt-4 grid gap-3 sm:grid-cols-4">
            <label className="text-xs text-stone-500 sm:col-span-2">
              Usar dados do item da NF-e
              <select name="nota_item_id" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900">
                <option value="">Nenhum — cadastro manual</option>
                {(itens ?? []).map((item) => <option key={item.id} value={item.id}>{item.descricao}{item.ncm ? ` · NCM ${item.ncm}` : ""}</option>)}
              </select>
            </label>
            <label className="text-xs text-stone-500 sm:col-span-2">
              Nome interno (opcional ao selecionar item da nota)
              <input name="nome" minLength={2} maxLength={120} placeholder="Ex.: Tomate" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900" />
            </label>
            <label className="text-xs text-stone-500">
              Unidade de controle
              <select name="unidade" required defaultValue="kg" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900">
                <option value="kg">kg</option><option value="g">g</option><option value="l">litro</option><option value="ml">ml</option><option value="un">unidade</option><option value="cx">caixa</option><option value="pct">pacote</option>
              </select>
            </label>
            <label className="text-xs text-stone-500">
              Estoque mínimo
              <input name="estoque_minimo" type="number" min="0" step="0.001" placeholder="Opcional" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900" />
            </label>
            <label className="text-xs text-stone-500">
              NCM manual
              <input name="ncm" inputMode="numeric" maxLength={8} placeholder="Opcional; substitui o NCM do XML" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900" />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-stone-600"><input name="ncm_revisado" type="checkbox" /> NCM conferido</label>
            <div className="sm:col-span-4"><button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Cadastrar com saldo zero</button></div>
          </form>
          <p className="mt-3 text-xs text-stone-500">O custo e a quantidade serão definidos somente quando a compra for confirmada.</p>
        </details>
      )}

      <form action={processarCompra.bind(null, nota.id)} className="mt-6">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="p-3">Item</th><th className="p-3">Produto da nota</th><th className="p-3">Dados fiscais</th><th className="p-3">Destinação e estoque</th><th className="p-3 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {(itens ?? []).map((item) => { const ingrediente = (ingredientes ?? []).find((value) => value.id === item.ingrediente_id); const memoria = (memorias ?? []).find((value) => value.codigo_fornecedor === item.codigo_fornecedor); return <tr key={item.id} className="align-top"><td className="p-3">{item.numero_item}</td><td className="p-3"><p className="font-medium text-stone-900">{item.descricao}</p><p className="text-xs text-stone-500">NF-e: {Number(item.quantidade)} {item.unidade} · {money(Number(item.valor_unitario))}/un.</p><p className="text-xs text-stone-500">EAN {item.ean || "—"}</p></td><td className="p-3 text-xs">NCM {item.ncm || "—"}<br />CFOP {item.cfop || "—"}</td><td className="p-3">{processada ? <div><p className="font-medium text-stone-800">{destinationLabels[item.destinacao] || item.destinacao}</p>{ingrediente && <p className="mt-1 text-xs text-stone-500">{ingrediente.nome}: {Number(item.quantidade_estoque)} {ingrediente.unidade}</p>}</div> : <ItemClassification itemId={item.id} invoiceQuantity={Number(item.quantidade)} invoiceUnit={item.unidade} ingredients={(ingredientes ?? []).map(({ id: ingredientId, nome, unidade }) => ({ id: ingredientId, nome, unidade }))} suggestedDestination={memoria?.destinacao} suggestedIngredientId={memoria?.ingrediente_id ?? undefined} suggestedStockQuantity={memoria?.fator_conversao ? Number(memoria.fator_conversao) * Number(item.quantidade) : undefined} disabled={!isGerente} />}</td><td className="p-3 text-right font-medium">{money(Number(item.valor_total))}</td></tr>; })}
          </tbody>
        </table>
      </div>
      {!processada && isGerente && <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4"><p className="text-sm font-medium text-stone-900">Confirmação do recebimento</p><p className="mt-1 text-xs text-stone-500">Classifique cada item. Somente insumos, embalagens e mercadorias para revenda movimentam estoque; ativos ganham registro patrimonial.</p>{(pedidosEmitidos ?? []).length > 0 && <label className="mt-4 block text-sm text-stone-600"><span className="mb-1 block text-xs">Esta nota atende a qual pedido de compra?</span><select name="pedido_compra_id" defaultValue="" className="w-full max-w-sm rounded-md border border-stone-300 px-3 py-2 sm:w-auto"><option value="">Nenhum (compra avulsa)</option>{(pedidosEmitidos ?? []).map((pedido) => <option key={pedido.id} value={pedido.id}>{pedido.numero_controle}</option>)}</select></label>}<div className="mt-4 flex flex-wrap items-end gap-4"><label className="flex items-center gap-2 text-sm"><input name="gerar_conta" type="checkbox" defaultChecked /> Gerar conta a pagar</label>{(parcelas ?? []).length > 0 ? <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">Serão geradas {(parcelas ?? []).length} contas com os vencimentos do XML.</p> : <label className="text-sm text-stone-600"><span className="mb-1 block text-xs">Vencimento</span><input name="vencimento" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-stone-300 px-3 py-2" /></label>}<button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Confirmar compra</button></div><p className="mt-3 text-xs text-amber-700">Revise a destinação e as conversões. A operação é auditável e não pode ser executada duas vezes.</p></div>}
      {processada && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Compra processada. As destinações foram registradas e somente os itens com controle de estoque movimentaram saldo e custo médio.</p>}
      </form>
    </div>
  );
}
