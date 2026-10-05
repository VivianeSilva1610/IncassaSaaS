import { requireRestaurantSubscription } from "@/lib/subscription";
import { addCaixaMovimento, deleteCaixaMovimento } from "@/app/restaurante/actions";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CaixaPage() {
  const { supabase } = await requireRestaurantSubscription();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const inicioMes = startOfMonth.toISOString().slice(0, 10);

  const [{ data: monthOrders }, { data: movimentos }] = await Promise.all([
    supabase.from("del_orders").select("totale").gte("created_at", startOfMonth.toISOString()),
    supabase.from("del_caixa_movimentos").select("*").order("data", { ascending: false }).limit(60),
  ]);

  const vendasDoMes = (monthOrders ?? []).reduce((sum, o) => sum + Number(o.totale), 0);
  const movimentosDoMes = (movimentos ?? []).filter((m) => m.data >= inicioMes);
  const entradasManuaisDoMes = movimentosDoMes.filter((m) => m.tipo === "entrada").reduce((sum, m) => sum + Number(m.valor), 0);
  const saidasManuaisDoMes = movimentosDoMes.filter((m) => m.tipo === "saida").reduce((sum, m) => sum + Number(m.valor), 0);
  const saldoDoMes = vendasDoMes + entradasManuaisDoMes - saidasManuaisDoMes;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Caixa</h1>
      <p className="mt-1 text-sm text-stone-600">
        Vendas já são somadas automaticamente aqui. Lance abaixo despesas, retiradas e outras entradas ou saídas.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Vendas do mês</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatReal(vendasDoMes)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Outras entradas / saídas do mês</p>
          <p className="mt-1 text-xl font-bold text-stone-900">
            {formatReal(entradasManuaisDoMes)} / {formatReal(saidasManuaisDoMes)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Saldo do mês</p>
          <p className={`mt-1 text-xl font-bold ${saldoDoMes >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatReal(saldoDoMes)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Novo lançamento</h2>
        <form action={addCaixaMovimento} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <select name="tipo" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="saida">Saída (despesa, retirada…)</option>
            <option value="entrada">Entrada (aporte, outra receita…)</option>
          </select>
          <select name="categoria" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="despesa">Despesa</option>
            <option value="retirada">Retirada</option>
            <option value="aporte">Aporte</option>
            <option value="outro">Outro</option>
          </select>
          <input name="valor" type="number" step="0.01" min="0" required placeholder="Valor (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="descrizione" placeholder="Descrição (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            Registrar lançamento
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Lançamentos recentes</h2>
        <div className="mt-2 space-y-1.5">
          {(movimentos ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <div>
                <span className={m.tipo === "entrada" ? "text-emerald-700" : "text-red-600"}>
                  {m.tipo === "entrada" ? "+" : "−"} {formatReal(Number(m.valor))}
                </span>
                <span className="ml-2 text-stone-500">
                  {m.categoria} · {m.data}
                  {m.descrizione ? ` · ${m.descrizione}` : ""}
                  {m.operador_email ? ` · ${m.operador_email}` : ""}
                </span>
              </div>
              <form action={deleteCaixaMovimento.bind(null, m.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Excluir
                </button>
              </form>
            </div>
          ))}
          {(movimentos ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum lançamento ainda.</p>}
        </div>
      </section>
    </div>
  );
}
