import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { criarOrcamento } from "./actions";

const statusLabels: Record<string, string> = { aberto: "Aguardando resposta", respondido: "Com resposta(s)", aprovado: "Aprovado", cancelado: "Cancelado" };
const statusClasses: Record<string, string> = {
  aberto: "bg-amber-100 text-amber-700",
  respondido: "bg-sky-100 text-sky-700",
  aprovado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-stone-200 text-stone-500 line-through",
};

export default async function OrcamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string; erro?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const params = await searchParams;

  const [{ data: solicitacoesAbertas }, { data: fornecedores }, { data: orcamentos }] = await Promise.all([
    supabase.from("del_solicitacoes_compra").select("id, numero_controle, descricao_snapshot, quantidade, unidade_snapshot").eq("owner_id", restaurantOwnerId).eq("status", "aberta").order("created_at"),
    supabase.from("del_fornecedores").select("id, razao_social, nome_fantasia").eq("owner_id", restaurantOwnerId).order("razao_social"),
    supabase.from("del_orcamentos_compra").select("id, numero_controle, status, observacao, created_at").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <div>
      <Link href="/restaurante/compras" className="text-sm text-amber-700 underline underline-offset-2">
        ← Compras
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Orçamentos</h1>
      <p className="mt-1 text-sm text-stone-600">
        Reúna solicitações em aberto e peça preço a um ou mais fornecedores. Nenhum custo interno é enviado —
        só produto e quantidade.
      </p>

      {params.sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.sucesso}</p>}
      {params.erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.erro}</p>}

      <form action={criarOrcamento} className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">Novo orçamento</h2>
        <input name="observacao" placeholder="Observação (opcional)" maxLength={1000} className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />

        <div className="mt-4">
          <p className="text-xs font-medium text-stone-500">Solicitações em aberto</p>
          <div className="mt-2 space-y-1">
            {(solicitacoesAbertas ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name={`solicitacao_${s.id}`} />
                {s.numero_controle} — {Number(s.quantidade)} {s.unidade_snapshot} de {s.descricao_snapshot}
              </label>
            ))}
            {(solicitacoesAbertas ?? []).length === 0 && (
              <p className="text-sm text-stone-500">
                Nenhuma solicitação em aberto —{" "}
                <Link href="/restaurante/compras/solicitacoes" className="text-amber-700 underline underline-offset-2">
                  crie uma primeiro
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-stone-500">Fornecedores a consultar</p>
          <div className="mt-2 space-y-1">
            {(fornecedores ?? []).map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" name={`fornecedor_${f.id}`} />
                {f.nome_fantasia || f.razao_social}
              </label>
            ))}
            {(fornecedores ?? []).length === 0 && (
              <p className="text-sm text-stone-500">Nenhum fornecedor cadastrado ainda — importe uma NF-e dele primeiro em Compras e fornecedores (NF-e).</p>
            )}
          </div>
        </div>

        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
          Criar orçamento
        </button>
      </form>

      <div className="mt-7 space-y-2">
        <h2 className="font-semibold text-stone-900">Orçamentos</h2>
        {(orcamentos ?? []).map((o) => (
          <Link key={o.id} href={`/restaurante/compras/orcamentos/${o.id}`} className="block rounded-lg border border-stone-200 bg-white p-3 text-sm hover:border-amber-300">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-900">{o.numero_controle}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[o.status] ?? ""}`}>{statusLabels[o.status] ?? o.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">{new Date(o.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
            {o.observacao && <p className="mt-0.5 text-xs text-stone-500">{o.observacao}</p>}
          </Link>
        ))}
        {(orcamentos ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum orçamento criado ainda.</p>}
      </div>
    </div>
  );
}
