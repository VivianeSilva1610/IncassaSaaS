import { redirect } from "next/navigation";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; vazio: string; colunaQuando: string; colunaQuem: string; colunaOque: string;
}> = {
  "pt-BR": {
    titulo: "Atividade da equipe",
    descricao: "Quem fez o quê — fechamento de caixa, produtos, estoque, pedidos e compras.",
    vazio: "Ainda não há nenhuma atividade registrada.",
    colunaQuando: "Quando", colunaQuem: "Quem", colunaOque: "O que",
  },
  it: {
    titulo: "Attività del team",
    descricao: "Chi ha fatto cosa — chiusura cassa, prodotti, magazzino, ordini e acquisti.",
    vazio: "Ancora nessuna attività registrata.",
    colunaQuando: "Quando", colunaQuem: "Chi", colunaOque: "Cosa",
  },
};

const LABEL_ACAO: Record<string, { "pt-BR": string; it: string }> = {
  produto_criado: { "pt-BR": "Criou o produto", it: "Ha creato il prodotto" },
  produto_editado: { "pt-BR": "Editou o produto", it: "Ha modificato il prodotto" },
  produto_removido: { "pt-BR": "Removeu um produto", it: "Ha rimosso un prodotto" },
  produto_ativado: { "pt-BR": "Ativou um produto", it: "Ha attivato un prodotto" },
  produto_desativado: { "pt-BR": "Desativou um produto", it: "Ha disattivato un prodotto" },
  ingrediente_criado: { "pt-BR": "Cadastrou o ingrediente", it: "Ha registrato l'ingrediente" },
  ingrediente_editado: { "pt-BR": "Editou o ingrediente", it: "Ha modificato l'ingrediente" },
  ingrediente_removido: { "pt-BR": "Removeu um ingrediente", it: "Ha rimosso un ingrediente" },
  compra_fornecedor_registrada: { "pt-BR": "Registrou compra de fornecedor", it: "Ha registrato un acquisto fornitore" },
  estoque_entrada: { "pt-BR": "Lançou entrada de estoque", it: "Ha registrato un'entrata di magazzino" },
  estoque_saida: { "pt-BR": "Lançou saída de estoque", it: "Ha registrato un'uscita di magazzino" },
  estoque_ajuste: { "pt-BR": "Ajustou o estoque", it: "Ha rettificato il magazzino" },
  estoque_perda: { "pt-BR": "Lançou perda de estoque", it: "Ha registrato una perdita di magazzino" },
  lote_estoque_removido: { "pt-BR": "Removeu um lote", it: "Ha rimosso un lotto" },
  pedido_criado: { "pt-BR": "Criou um pedido", it: "Ha creato un ordine" },
  pedido_status_cancelado: { "pt-BR": "Cancelou um pedido", it: "Ha annullato un ordine" },
  pedido_status_entregue: { "pt-BR": "Marcou pedido como entregue", it: "Ha segnato l'ordine come consegnato" },
  pedido_estornado: { "pt-BR": "Estornou um pedido", it: "Ha rimborsato un ordine" },
  pedido_removido: { "pt-BR": "Excluiu um pedido", it: "Ha eliminato un ordine" },
  pedido_marcado_pago: { "pt-BR": "Marcou pedido como pago", it: "Ha segnato l'ordine come pagato" },
  caixa_fechado: { "pt-BR": "Fechou o caixa", it: "Ha chiuso la cassa" },
  caixa_entrada: { "pt-BR": "Lançou entrada no caixa", it: "Ha registrato un'entrata in cassa" },
  caixa_saida: { "pt-BR": "Lançou saída no caixa", it: "Ha registrato un'uscita in cassa" },
  caixa_movimento_removido: { "pt-BR": "Removeu um lançamento de caixa", it: "Ha rimosso un movimento di cassa" },
  fornecedor_cadastrado: { "pt-BR": "Cadastrou um fornecedor", it: "Ha registrato un fornitore" },
  orcamento_compra_criado: { "pt-BR": "Criou um orçamento de compra", it: "Ha creato un preventivo d'acquisto" },
  orcamento_compra_aprovado: { "pt-BR": "Aprovou um orçamento de compra", it: "Ha approvato un preventivo d'acquisto" },
  orcamento_compra_cancelado: { "pt-BR": "Cancelou um orçamento de compra", it: "Ha annullato un preventivo d'acquisto" },
  solicitacao_compra_criada: { "pt-BR": "Criou solicitação de compra", it: "Ha creato una richiesta d'acquisto" },
  solicitacao_compra_cancelada: { "pt-BR": "Cancelou solicitação de compra", it: "Ha annullato una richiesta d'acquisto" },
};

function descreverAcao(acao: string, locale: RestauranteLocale): string {
  return LABEL_ACAO[acao]?.[locale] ?? acao.replace(/_/g, " ");
}

export default async function AtividadeEquipePage() {
  const { supabase, restaurantOwnerId, isGerente, locale } = await requireRestaurantSubscription("gestao");
  if (!isGerente) redirect("/restaurante");
  const t = CONTEUDO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";

  const { data: atividades } = await supabase
    .from("restaurant_activity_log")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase text-stone-500">
            <tr>
              <th className="px-4 py-2">{t.colunaQuando}</th>
              <th className="px-4 py-2">{t.colunaQuem}</th>
              <th className="px-4 py-2">{t.colunaOque}</th>
            </tr>
          </thead>
          <tbody>
            {(atividades ?? []).map((a) => (
              <tr key={a.id} className="border-b border-stone-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-stone-500">
                  {new Date(a.created_at).toLocaleString(intlLocale, { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-stone-700">{a.ator_nome || a.ator_email}</td>
                <td className="px-4 py-2 text-stone-900">
                  {descreverAcao(a.acao, locale)}
                  {a.detalhe && <span className="text-stone-500"> — {a.detalhe}</span>}
                </td>
              </tr>
            ))}
            {(atividades ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-stone-500">{t.vazio}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
