import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { enviarOrcamentoEmail, registrarRespostaFornecedor, aprovarOrcamento, cancelarOrcamento } from "../actions";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function OrcamentoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sucesso?: string; erro?: string }>;
}) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const { id } = await params;
  const { sucesso, erro } = await searchParams;

  const { data: orcamento } = await supabase.from("del_orcamentos_compra").select("*").eq("id", id).eq("owner_id", restaurantOwnerId).maybeSingle();
  if (!orcamento) notFound();

  const [{ data: itens }, { data: convites }] = await Promise.all([
    supabase.from("del_orcamento_itens").select("*").eq("orcamento_id", id).eq("owner_id", restaurantOwnerId).order("descricao_snapshot"),
    supabase.from("del_orcamento_fornecedores").select("*, del_fornecedores(razao_social, nome_fantasia, email)").eq("orcamento_id", id).eq("owner_id", restaurantOwnerId).order("created_at"),
  ]);

  const itemIds = (itens ?? []).map((i) => i.id);
  const { data: respostaItens } = itemIds.length
    ? await supabase.from("del_orcamento_resposta_itens").select("orcamento_fornecedor_id, orcamento_item_id, preco_unitario").in("orcamento_item_id", itemIds).eq("owner_id", restaurantOwnerId)
    : { data: [] };

  const podeAprovar = orcamento.status === "aberto" || orcamento.status === "respondido";

  return (
    <div>
      <Link href="/restaurante/compras/orcamentos" className="text-sm text-amber-700 underline underline-offset-2">
        ← Orçamentos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{orcamento.numero_controle}</h1>
      {orcamento.observacao && <p className="mt-1 text-sm text-stone-600">{orcamento.observacao}</p>}

      {sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{sucesso}</p>}
      {erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">Itens solicitados</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
          {(itens ?? []).map((item) => (
            <li key={item.id}>
              {Number(item.quantidade)} {item.unidade_snapshot} de {item.descricao_snapshot}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 space-y-4">
        <h2 className="font-semibold text-stone-900">Fornecedores consultados</h2>
        {(convites ?? []).map((c) => {
          const fornecedor = Array.isArray(c.del_fornecedores) ? c.del_fornecedores[0] : c.del_fornecedores;
          const precosDoFornecedor = new Map((respostaItens ?? []).filter((r) => r.orcamento_fornecedor_id === c.id).map((r) => [r.orcamento_item_id, Number(r.preco_unitario)]));
          const subtotal = (itens ?? []).reduce((sum, item) => sum + (precosDoFornecedor.get(item.id) ?? 0) * Number(item.quantidade), 0);
          const total = subtotal + Number(c.frete ?? 0) - Number(c.desconto ?? 0);

          return (
            <div key={c.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-stone-900">{fornecedor?.nome_fantasia || fornecedor?.razao_social}</span>
                {c.respondido_em ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Respondeu</span>
                ) : c.enviado_email_em ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Enviado, aguardando</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Não enviado</span>
                )}
              </div>

              {!c.enviado_email_em && isGerente && (
                <form action={enviarOrcamentoEmail.bind(null, id, c.id)} className="mt-3 flex flex-wrap gap-2">
                  <input name="email" type="email" required defaultValue={fornecedor?.email ?? ""} placeholder="E-mail do fornecedor" className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                    Enviar pedido de orçamento
                  </button>
                </form>
              )}

              {!c.respondido_em && isGerente && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-amber-700">Registrar resposta recebida</summary>
                  <form action={registrarRespostaFornecedor.bind(null, id, c.id)} className="mt-3 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    {(itens ?? []).map((item) => (
                      <label key={item.id} className="flex items-center justify-between gap-2 text-sm text-stone-700">
                        <span>
                          {Number(item.quantidade)} {item.unidade_snapshot} de {item.descricao_snapshot}
                        </span>
                        <input name={`preco_${item.id}`} type="number" step="0.0001" min="0" required placeholder="Preço unitário" className="w-36 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      </label>
                    ))}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input name="frete" type="number" step="0.01" min="0" placeholder="Frete (R$)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="desconto" type="number" step="0.01" min="0" placeholder="Desconto (R$)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="prazo_entrega_dias" type="number" step="1" min="0" placeholder="Prazo de entrega (dias)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="condicao_pagamento" placeholder="Condição de pagamento" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    </div>
                    <input name="observacao_resposta" placeholder="Observação (opcional)" className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                      Salvar resposta
                    </button>
                  </form>
                </details>
              )}

              {c.respondido_em && (
                <div className="mt-3 grid gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm sm:grid-cols-2">
                  <p>
                    Subtotal: <strong>{money(subtotal)}</strong>
                  </p>
                  <p>
                    Total (com frete/desconto): <strong>{money(total)}</strong>
                  </p>
                  <p>Frete: {money(Number(c.frete ?? 0))}</p>
                  <p>Desconto: {money(Number(c.desconto ?? 0))}</p>
                  {c.prazo_entrega_dias != null && <p>Prazo de entrega: {c.prazo_entrega_dias} dia(s)</p>}
                  {c.condicao_pagamento && <p>Condição de pagamento: {c.condicao_pagamento}</p>}
                  {c.observacao_resposta && (
                    <p className="sm:col-span-2 text-stone-600">Obs: {c.observacao_resposta}</p>
                  )}

                  {podeAprovar && isGerente && (
                    <form action={aprovarOrcamento.bind(null, id, c.id)} className="sm:col-span-2">
                      <button type="submit" className="mt-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                        Aprovar este orçamento e gerar pedido de compra
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {orcamento.status === "aprovado" && orcamento.pedido_compra_id && (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Orçamento aprovado.{" "}
          <Link href="/restaurante/compras/pedidos" className="underline underline-offset-2">
            Ver pedido de compra gerado
          </Link>
          .
        </p>
      )}

      {podeAprovar && isGerente && (
        <form action={cancelarOrcamento.bind(null, id)} className="mt-4">
          <button type="submit" className="text-xs text-red-600 hover:underline">
            Cancelar orçamento
          </button>
        </form>
      )}
    </div>
  );
}
