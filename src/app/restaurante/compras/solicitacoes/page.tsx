import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { criarSolicitacoes, cancelarSolicitacao } from "./actions";

const statusLabels: Record<string, string> = { aberta: "Aberta", em_orcamento: "Em orçamento", atendida: "Atendida", cancelada: "Cancelada" };
const statusClasses: Record<string, string> = {
  aberta: "bg-amber-100 text-amber-700",
  em_orcamento: "bg-sky-100 text-sky-700",
  atendida: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-stone-200 text-stone-500 line-through",
};

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ sucesso?: string; erro?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const params = await searchParams;

  const [{ data: ingredientes }, { data: solicitacoes }] = await Promise.all([
    supabase.from("del_ingredients").select("id, nome, unidade, quantidade_atual, estoque_minimo").eq("owner_id", restaurantOwnerId).order("nome"),
    supabase.from("del_solicitacoes_compra").select("*").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <div>
      <Link href="/restaurante/compras" className="text-sm text-amber-700 underline underline-offset-2">
        ← Compras
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Solicitações de compra</h1>
      <p className="mt-1 text-sm text-stone-600">
        Só produto e quantidade — sem fornecedor, sem preço negociado. O custo mostrado é só uma referência
        interna; quando a solicitação virar orçamento, esse valor não é enviado ao fornecedor.
      </p>

      {params.sucesso && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{params.sucesso}</p>}
      {params.erro && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{params.erro}</p>}

      <form action={criarSolicitacoes} className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">Nova solicitação</h2>
        <input name="observacao" placeholder="Observação (opcional)" maxLength={1000} className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                <th className="py-2 pr-3">Pedir</th>
                <th className="py-2 pr-3">Produto</th>
                <th className="py-2 pr-3">Saldo / mínimo</th>
                <th className="py-2 pr-3">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {(ingredientes ?? []).map((i) => {
                const baixo = i.estoque_minimo != null && Number(i.quantidade_atual) <= Number(i.estoque_minimo);
                const sugestao = Math.max(Number(i.estoque_minimo ?? 0) - Number(i.quantidade_atual), 1);
                return (
                  <tr key={i.id} className={`border-b border-stone-100 ${baixo ? "bg-amber-50" : ""}`}>
                    <td className="py-2 pr-3">
                      <input type="checkbox" name={`selecionar_${i.id}`} />
                    </td>
                    <td className="py-2 pr-3">
                      {i.nome}
                      {baixo && <span className="ml-2 text-xs text-amber-700">estoque baixo</span>}
                    </td>
                    <td className="py-2 pr-3 text-stone-600">
                      {Number(i.quantidade_atual)} / {i.estoque_minimo == null ? "—" : Number(i.estoque_minimo)} {i.unidade}
                    </td>
                    <td className="py-2 pr-3">
                      <input name={`quantidade_${i.id}`} type="number" min="0.0001" step="0.0001" defaultValue={sugestao} className="w-28 rounded-md border border-stone-300 px-2 py-1.5 text-sm" />{" "}
                      <span className="text-xs text-stone-500">{i.unidade}</span>
                    </td>
                  </tr>
                );
              })}
              {(ingredientes ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-stone-500">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
          Registrar solicitação
        </button>
      </form>

      <div className="mt-7 space-y-2">
        <h2 className="font-semibold text-stone-900">Solicitações</h2>
        {(solicitacoes ?? []).map((s) => (
          <div key={s.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-900">
                {s.numero_controle} · {s.descricao_snapshot}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses[s.status] ?? ""}`}>{statusLabels[s.status] ?? s.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              {Number(s.quantidade)} {s.unidade_snapshot} · {s.solicitado_por_email}
              {s.custo_referencia != null && ` · referência interna R$${Number(s.custo_referencia).toFixed(2)}`}
            </p>
            {s.observacao && <p className="mt-0.5 text-xs text-stone-500">{s.observacao}</p>}
            {s.status === "aberta" && (
              <form action={cancelarSolicitacao.bind(null, s.id)} className="mt-2">
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Cancelar
                </button>
              </form>
            )}
          </div>
        ))}
        {(solicitacoes ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma solicitação registrada ainda.</p>}
      </div>

      <p className="mt-6 text-xs text-stone-500">
        Pra pedir orçamento a fornecedores a partir de solicitações em aberto, use{" "}
        <Link href="/restaurante/compras/orcamentos" className="text-amber-700 underline underline-offset-2">
          Orçamentos
        </Link>
        .
      </p>
    </div>
  );
}
