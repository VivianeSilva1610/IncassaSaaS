import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { enviarOrcamentoEmail, registrarRespostaFornecedor, aprovarOrcamento, cancelarOrcamento } from "../actions";

function moneyBr(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
function moneyIt(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; itensSolicitados: string; fornecedoresConsultados: string; respondeu: string;
  enviadoAguardando: string; naoEnviado: string; emailPlaceholder: string; enviarPedido: string;
  registrarResposta: string; precoUnitario: string; frete: string; desconto: string; prazoEntrega: string;
  condicaoPagamento: string; observacaoOpcional: string; salvarResposta: string; subtotal: string;
  totalComFreteDesconto: string; freteLabel: string; descontoLabel: string; prazoEntregaLabel: (dias: number) => string;
  condicaoPagamentoLabel: string; obs: string; aprovarGerarPedido: string; orcamentoAprovado: string;
  verPedidoGerado: string; cancelarOrcamento: string;
}> = {
  "pt-BR": {
    voltar: "← Orçamentos", itensSolicitados: "Itens solicitados", fornecedoresConsultados: "Fornecedores consultados",
    respondeu: "Respondeu", enviadoAguardando: "Enviado, aguardando", naoEnviado: "Não enviado",
    emailPlaceholder: "E-mail do fornecedor", enviarPedido: "Enviar pedido de orçamento",
    registrarResposta: "Registrar resposta recebida", precoUnitario: "Preço unitário",
    frete: "Frete (R$)", desconto: "Desconto (R$)", prazoEntrega: "Prazo de entrega (dias)",
    condicaoPagamento: "Condição de pagamento", observacaoOpcional: "Observação (opcional)", salvarResposta: "Salvar resposta",
    subtotal: "Subtotal:", totalComFreteDesconto: "Total (com frete/desconto):", freteLabel: "Frete:", descontoLabel: "Desconto:",
    prazoEntregaLabel: (dias) => `Prazo de entrega: ${dias} dia(s)`, condicaoPagamentoLabel: "Condição de pagamento:", obs: "Obs:",
    aprovarGerarPedido: "Aprovar este orçamento e gerar pedido de compra",
    orcamentoAprovado: "Orçamento aprovado.", verPedidoGerado: "Ver pedido de compra gerado",
    cancelarOrcamento: "Cancelar orçamento",
  },
  it: {
    voltar: "← Preventivi", itensSolicitados: "Articoli richiesti", fornecedoresConsultados: "Fornitori consultati",
    respondeu: "Ha risposto", enviadoAguardando: "Inviato, in attesa", naoEnviado: "Non inviato",
    emailPlaceholder: "E-mail del fornitore", enviarPedido: "Invia richiesta di preventivo",
    registrarResposta: "Registra risposta ricevuta", precoUnitario: "Prezzo unitario",
    frete: "Spese di trasporto (EUR)", desconto: "Sconto (EUR)", prazoEntrega: "Tempo di consegna (giorni)",
    condicaoPagamento: "Condizioni di pagamento", observacaoOpcional: "Nota (opzionale)", salvarResposta: "Salva risposta",
    subtotal: "Subtotale:", totalComFreteDesconto: "Totale (con trasporto/sconto):", freteLabel: "Trasporto:", descontoLabel: "Sconto:",
    prazoEntregaLabel: (dias) => `Tempo di consegna: ${dias} giorno/i`, condicaoPagamentoLabel: "Condizioni di pagamento:", obs: "Nota:",
    aprovarGerarPedido: "Approva questo preventivo e genera l'ordine di acquisto",
    orcamentoAprovado: "Preventivo approvato.", verPedidoGerado: "Vedi l'ordine di acquisto generato",
    cancelarOrcamento: "Annulla preventivo",
  },
};

export default async function OrcamentoDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sucesso?: string; erro?: string }>;
}) {
  const { supabase, restaurantOwnerId, isGerente, locale } = await requireRestaurantSubscription("compras");
  const t = CONTEUDO[locale];
  const money = locale === "it" ? moneyIt : moneyBr;
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
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{orcamento.numero_controle}</h1>
      {orcamento.observacao && <p className="mt-1 text-sm text-stone-600">{orcamento.observacao}</p>}

      {sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{sucesso}</p>}
      {erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.itensSolicitados}</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-stone-700">
          {(itens ?? []).map((item) => (
            <li key={item.id}>
              {Number(item.quantidade)} {item.unidade_snapshot} de {item.descricao_snapshot}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 space-y-4">
        <h2 className="font-semibold text-stone-900">{t.fornecedoresConsultados}</h2>
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
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{t.respondeu}</span>
                ) : c.enviado_email_em ? (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">{t.enviadoAguardando}</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t.naoEnviado}</span>
                )}
              </div>

              {!c.enviado_email_em && isGerente && (
                <form action={enviarOrcamentoEmail.bind(null, id, c.id)} className="mt-3 flex flex-wrap gap-2">
                  <input name="email" type="email" required defaultValue={fornecedor?.email ?? ""} placeholder={t.emailPlaceholder} className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                    {t.enviarPedido}
                  </button>
                </form>
              )}

              {!c.respondido_em && isGerente && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-amber-700">{t.registrarResposta}</summary>
                  <form action={registrarRespostaFornecedor.bind(null, id, c.id)} className="mt-3 space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    {(itens ?? []).map((item) => (
                      <label key={item.id} className="flex items-center justify-between gap-2 text-sm text-stone-700">
                        <span>
                          {Number(item.quantidade)} {item.unidade_snapshot} de {item.descricao_snapshot}
                        </span>
                        <input name={`preco_${item.id}`} type="number" step="0.0001" min="0" required placeholder={t.precoUnitario} className="w-36 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      </label>
                    ))}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input name="frete" type="number" step="0.01" min="0" placeholder={t.frete} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="desconto" type="number" step="0.01" min="0" placeholder={t.desconto} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="prazo_entrega_dias" type="number" step="1" min="0" placeholder={t.prazoEntrega} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                      <input name="condicao_pagamento" placeholder={t.condicaoPagamento} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    </div>
                    <input name="observacao_resposta" placeholder={t.observacaoOpcional} className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                    <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
                      {t.salvarResposta}
                    </button>
                  </form>
                </details>
              )}

              {c.respondido_em && (
                <div className="mt-3 grid gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm sm:grid-cols-2">
                  <p>
                    {t.subtotal} <strong>{money(subtotal)}</strong>
                  </p>
                  <p>
                    {t.totalComFreteDesconto} <strong>{money(total)}</strong>
                  </p>
                  <p>{t.freteLabel} {money(Number(c.frete ?? 0))}</p>
                  <p>{t.descontoLabel} {money(Number(c.desconto ?? 0))}</p>
                  {c.prazo_entrega_dias != null && <p>{t.prazoEntregaLabel(c.prazo_entrega_dias)}</p>}
                  {c.condicao_pagamento && <p>{t.condicaoPagamentoLabel} {c.condicao_pagamento}</p>}
                  {c.observacao_resposta && (
                    <p className="sm:col-span-2 text-stone-600">{t.obs} {c.observacao_resposta}</p>
                  )}

                  {podeAprovar && isGerente && (
                    <form action={aprovarOrcamento.bind(null, id, c.id)} className="sm:col-span-2">
                      <button type="submit" className="mt-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                        {t.aprovarGerarPedido}
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
          {t.orcamentoAprovado}{" "}
          <Link href="/restaurante/compras/pedidos" className="underline underline-offset-2">
            {t.verPedidoGerado}
          </Link>
          .
        </p>
      )}

      {podeAprovar && isGerente && (
        <form action={cancelarOrcamento.bind(null, id)} className="mt-4">
          <button type="submit" className="text-xs text-red-600 hover:underline">
            {t.cancelarOrcamento}
          </button>
        </form>
      )}
    </div>
  );
}
