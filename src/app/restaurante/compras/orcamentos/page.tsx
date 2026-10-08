import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { criarOrcamento } from "./actions";
import { cadastrarFornecedorManual } from "../fornecedores/actions";

const STATUS_LABELS: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { aberto: "Aguardando resposta", respondido: "Com resposta(s)", aprovado: "Aprovado", cancelado: "Cancelado" },
  it: { aberto: "In attesa di risposta", respondido: "Con risposta/e", aprovado: "Approvato", cancelado: "Annullato" },
};
const statusClasses: Record<string, string> = {
  aberto: "bg-amber-100 text-amber-700",
  respondido: "bg-sky-100 text-sky-700",
  aprovado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-stone-200 text-stone-500 line-through",
};

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; novo: string; observacaoPlaceholder: string;
  solicitacoesAbertas: string; nenhumaSolicitacao: (link: React.ReactNode) => React.ReactNode;
  fornecedoresConsultar: string; nenhumFornecedor: string; cadastrarFornecedor: string;
  documento: string; razaoSocial: string; nomeFantasia: string; salvarFornecedor: string;
  criar: string; orcamentosTitulo: string; nenhumOrcamento: string;
}> = {
  "pt-BR": {
    voltar: "← Compras", titulo: "Orçamentos",
    descricao: "Reúna solicitações em aberto e peça preço a um ou mais fornecedores. Nenhum custo interno é enviado — só produto e quantidade.",
    novo: "Novo orçamento", observacaoPlaceholder: "Observação (opcional)",
    solicitacoesAbertas: "Solicitações em aberto",
    nenhumaSolicitacao: (link) => <>Nenhuma solicitação em aberto — {link}.</>,
    fornecedoresConsultar: "Fornecedores a consultar", nenhumFornecedor: "Nenhum fornecedor cadastrado ainda.",
    cadastrarFornecedor: "+ Cadastrar fornecedor", documento: "CNPJ ou CPF", razaoSocial: "Razão social",
    nomeFantasia: "Nome fantasia (opcional)", salvarFornecedor: "Salvar fornecedor",
    criar: "Criar orçamento", orcamentosTitulo: "Orçamentos", nenhumOrcamento: "Nenhum orçamento criado ainda.",
  },
  it: {
    voltar: "← Acquisti", titulo: "Preventivi",
    descricao: "Raccogli le richieste aperte e chiedi un prezzo a uno o più fornitori. Nessun costo interno viene inviato — solo prodotto e quantità.",
    novo: "Nuovo preventivo", observacaoPlaceholder: "Nota (opzionale)",
    solicitacoesAbertas: "Richieste aperte",
    nenhumaSolicitacao: (link) => <>Nessuna richiesta aperta — {link}.</>,
    fornecedoresConsultar: "Fornitori da consultare", nenhumFornecedor: "Nessun fornitore registrato ancora.",
    cadastrarFornecedor: "+ Registra fornitore", documento: "Partita IVA o Codice Fiscale", razaoSocial: "Ragione sociale",
    nomeFantasia: "Nome commerciale (opzionale)", salvarFornecedor: "Salva fornitore",
    criar: "Crea preventivo", orcamentosTitulo: "Preventivi", nenhumOrcamento: "Nessun preventivo creato ancora.",
  },
};

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string; erro?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("compras");
  const t = CONTEUDO[locale];
  const statusLabels = STATUS_LABELS[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const params = await searchParams;

  const [{ data: solicitacoesAbertas }, { data: fornecedores }, { data: orcamentos }] = await Promise.all([
    supabase.from("del_solicitacoes_compra").select("id, numero_controle, descricao_snapshot, quantidade, unidade_snapshot").eq("owner_id", restaurantOwnerId).eq("status", "aberta").order("created_at"),
    supabase.from("del_fornecedores").select("id, razao_social, nome_fantasia").eq("owner_id", restaurantOwnerId).order("razao_social"),
    supabase.from("del_orcamentos_compra").select("id, numero_controle, status, observacao, created_at").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div>
      <Link href="/restaurante/compras" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

      {params.sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.sucesso}</p>}
      {params.erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.erro}</p>}

      <form action={criarOrcamento} className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">{t.novo}</h2>
        <input name="observacao" placeholder={t.observacaoPlaceholder} maxLength={1000} className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />

        <div className="mt-4">
          <p className="text-xs font-medium text-stone-500">{t.solicitacoesAbertas}</p>
          <div className="mt-2 space-y-1">
            {(solicitacoesAbertas ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name={`solicitacao_${s.id}`} />
                {s.numero_controle} — {Number(s.quantidade)} {s.unidade_snapshot} de {s.descricao_snapshot}
              </label>
            ))}
            {(solicitacoesAbertas ?? []).length === 0 && (
              <p className="text-sm text-stone-500">
                {t.nenhumaSolicitacao(
                  <Link href="/restaurante/compras/solicitacoes" className="text-amber-700 underline underline-offset-2">
                    {locale === "it" ? "creane una prima" : "crie uma primeiro"}
                  </Link>,
                )}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-stone-500">{t.fornecedoresConsultar}</p>
          <div className="mt-2 space-y-1">
            {(fornecedores ?? []).map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name={`fornecedor_${f.id}`} />
                {f.nome_fantasia || f.razao_social}
              </label>
            ))}
            {(fornecedores ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumFornecedor}</p>}
          </div>
        </div>

        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
          {t.criar}
        </button>
      </form>

      <details className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-amber-700">{t.cadastrarFornecedor}</summary>
        <form action={cadastrarFornecedorManual} className="mt-3 grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="voltar" value="/restaurante/compras/orcamentos" />
          <input name="documento" placeholder={t.documento} required maxLength={40} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="razao_social" placeholder={t.razaoSocial} required maxLength={200} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="nome_fantasia" placeholder={t.nomeFantasia} maxLength={200} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-stone-900 px-3 py-2 text-xs font-medium text-white sm:col-span-3">{t.salvarFornecedor}</button>
        </form>
      </details>

      <div className="mt-7 space-y-2">
        <h2 className="font-semibold text-stone-900">{t.orcamentosTitulo}</h2>
        {(orcamentos ?? []).map((o) => (
          <Link key={o.id} href={`/restaurante/compras/orcamentos/${o.id}`} className="block rounded-lg border border-stone-200 bg-white p-3 text-sm hover:border-amber-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-900">{o.numero_controle}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[o.status] ?? ""}`}>{statusLabels[o.status] ?? o.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">{new Date(o.created_at).toLocaleString(intlLocale, { timeZone: timezone })}</p>
            {o.observacao && <p className="mt-0.5 text-xs text-stone-500">{o.observacao}</p>}
          </Link>
        ))}
        {(orcamentos ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumOrcamento}</p>}
      </div>
    </div>
  );
}
