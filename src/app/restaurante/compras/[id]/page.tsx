import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { processarCompra } from "../actions";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CompraDetalhePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sucesso?: string; erro?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription();
  const { data: nota } = await supabase
    .from("del_notas_entrada")
    .select("id, numero, serie, chave_acesso, fornecedor_nome, fornecedor_documento, destinatario_documento, valor_total, emitida_em, protocolo_autorizacao, status, importada_em")
    .eq("id", id)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  if (!nota) notFound();

  const { data: itens } = await supabase
    .from("del_notas_entrada_itens")
    .select("id, numero_item, codigo_fornecedor, ean, descricao, ncm, cest, cfop, unidade, quantidade, valor_unitario, valor_total, ingrediente_id, quantidade_estoque")
    .eq("nota_entrada_id", id)
    .eq("owner_id", restaurantOwnerId)
    .order("numero_item");

  const { data: ingredientes } = await supabase
    .from("del_ingredients")
    .select("id, nome, unidade, quantidade_atual")
    .eq("owner_id", restaurantOwnerId)
    .order("nome");

  const processada = nota.status === "processada";

  return (
    <div>
      <Link href="/restaurante/compras" className="text-sm text-amber-700 hover:underline">← Voltar para compras</Link>
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
      </div>

      <form action={processarCompra.bind(null, nota.id)} className="mt-6">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="p-3">Item</th><th className="p-3">Produto da nota</th><th className="p-3">Classificação</th><th className="p-3">Ingrediente no estoque</th><th className="p-3">Quantidade que entra</th><th className="p-3 text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {(itens ?? []).map((item) => { const ingrediente = (ingredientes ?? []).find((value) => value.id === item.ingrediente_id); return <tr key={item.id} className="align-top"><td className="p-3">{item.numero_item}</td><td className="p-3"><p className="font-medium text-stone-900">{item.descricao}</p><p className="text-xs text-stone-500">NF-e: {Number(item.quantidade)} {item.unidade} · {money(Number(item.valor_unitario))}/un.</p><p className="text-xs text-stone-500">EAN {item.ean || "—"}</p></td><td className="p-3 text-xs">NCM {item.ncm || "—"}<br />CFOP {item.cfop || "—"}</td><td className="p-3">{processada ? <span className="text-stone-700">{ingrediente?.nome || "Ingrediente removido"}</span> : <select name={`ingrediente_${item.id}`} required disabled={!isGerente} className="w-52 rounded-md border border-stone-300 px-2 py-2"><option value="">Selecione...</option>{(ingredientes ?? []).map((value) => <option key={value.id} value={value.id}>{value.nome} ({value.unidade})</option>)}</select>}</td><td className="p-3">{processada ? <span className="text-stone-700">{Number(item.quantidade_estoque)} {ingrediente?.unidade || ""}</span> : <input name={`quantidade_${item.id}`} type="number" required min="0.0001" step="0.0001" defaultValue={Number(item.quantidade)} disabled={!isGerente} className="w-32 rounded-md border border-stone-300 px-2 py-2" />}</td><td className="p-3 text-right font-medium">{money(Number(item.valor_total))}</td></tr>; })}
          </tbody>
        </table>
      </div>
      {!processada && isGerente && <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4"><p className="text-sm font-medium text-stone-900">Confirmação do recebimento</p><p className="mt-1 text-xs text-stone-500">A quantidade que entra permite converter caixas, pacotes ou litros da nota para a unidade usada no estoque.</p><div className="mt-4 flex flex-wrap items-end gap-4"><label className="flex items-center gap-2 text-sm"><input name="gerar_conta" type="checkbox" defaultChecked /> Gerar conta a pagar</label><label className="text-sm text-stone-600"><span className="mb-1 block text-xs">Vencimento</span><input name="vencimento" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-stone-300 px-3 py-2" /></label><button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700">Confirmar e lançar no estoque</button></div><p className="mt-3 text-xs text-amber-700">Revise as conversões antes de confirmar. A operação atualiza o custo médio e não pode ser executada duas vezes.</p></div>}
      {processada && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Compra processada. Os movimentos de entrada e o custo médio já foram registrados.</p>}
      </form>
    </div>
  );
}
