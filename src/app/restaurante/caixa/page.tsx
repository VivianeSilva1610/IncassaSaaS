import { requireRestaurantSubscription } from "@/lib/subscription";
import { addCaixaMovimento, deleteCaixaMovimento } from "@/app/restaurante/actions";
import Link from "next/link";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function CaixaPage() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = nowParts.find((part) => part.type === "year")!.value;
  const month = nowParts.find((part) => part.type === "month")!.value;
  const day = nowParts.find((part) => part.type === "day")!.value;
  const hoje = `${year}-${month}-${day}`;
  const inicioMes = `${year}-${month}-01`;
  const inicioMesIso = `${inicioMes}T00:00:00-03:00`;

  const [{ data: vendasCompetencia }, { data: recebimentos }, { data: estornos }, { data: valoresAReceber }, { data: movimentos }, { data: fechamentoHoje }, { data: contasAPagarAbertas }] = await Promise.all([
    supabase
      .from("del_orders")
      .select("totale, competencia_em")
      .gte("competencia_em", inicioMesIso)
      .neq("status", "cancelado"),
    supabase
      .from("del_orders")
      .select("valor_pago, totale, pago_em")
      .eq("pago", true)
      .gte("pago_em", inicioMesIso),
    supabase
      .from("del_pagamento_eventos")
      .select("valor_movimento, ocorrido_em")
      .eq("status", "confirmado")
      .gt("valor_movimento", 0)
      .gte("ocorrido_em", inicioMesIso),
    supabase
      .from("del_orders")
      .select("totale")
      .eq("pago", false)
      .neq("status", "cancelado")
      .neq("status", "aguardando_pagamento"),
    supabase.from("del_caixa_movimentos").select("*").order("data", { ascending: false }).limit(60),
    supabase.from("del_caixa_fechamentos").select("fechado_em, fechado_por_email").eq("owner_id", restaurantOwnerId).eq("data", hoje).maybeSingle(),
    supabase.from("del_contas_a_pagar").select("valor").eq("owner_id", restaurantOwnerId).eq("status", "a_pagar"),
  ]);

  const vendasDoMes = (vendasCompetencia ?? []).reduce((sum, o) => sum + Number(o.totale), 0);
  const recebimentosDoMes = (recebimentos ?? []).reduce(
    (sum, o) => sum + Number(o.valor_pago ?? o.totale),
    0,
  );
  const estornosDoMes = (estornos ?? []).reduce((sum, e) => sum + Number(e.valor_movimento), 0);
  const totalAReceber = (valoresAReceber ?? []).reduce((sum, o) => sum + Number(o.totale), 0);
  const movimentosDoMes = (movimentos ?? []).filter((m) => m.data >= inicioMes);
  const entradasManuaisDoMes = movimentosDoMes.filter((m) => m.tipo === "entrada").reduce((sum, m) => sum + Number(m.valor), 0);
  const saidasManuaisDoMes = movimentosDoMes.filter((m) => m.tipo === "saida").reduce((sum, m) => sum + Number(m.valor), 0);
  const saldoDoMes = recebimentosDoMes - estornosDoMes + entradasManuaisDoMes - saidasManuaisDoMes;
  const totalContasAPagar = (contasAPagarAbertas ?? []).reduce((sum, c) => sum + Number(c.valor), 0);
  const saldoEstimado = recebimentosDoMes + totalAReceber - totalContasAPagar;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Caixa</h1>
      <p className="mt-1 text-sm text-stone-600">
        Competência usa a data de entrega; caixa usa a data do pagamento. Lance abaixo apenas movimentações que não
        estejam nos pedidos, evitando duplicar vendas.
      </p>

      <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${fechamentoHoje ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div><p className="font-semibold text-stone-900">Caixa de hoje: {fechamentoHoje ? "fechado" : "aberto"}</p><p className="text-xs text-stone-600">{fechamentoHoje ? `Fechado por ${fechamentoHoje.fechado_por_email || "usuário identificado"}.` : "Confira os valores antes de encerrar o movimento do dia."}</p></div>
        {isOwner && <Link href={`/restaurante/fiscal/fechamento-diario?data=${hoje}`} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">{fechamentoHoje ? "Ver fechamento" : "Conferir e fechar caixa"}</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Vendas por competência</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatReal(vendasDoMes)}</p>
          <p className="mt-1 text-xs text-stone-400">Pedidos entregues neste mês</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Recebimentos do mês</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatReal(recebimentosDoMes)}</p>
          <p className="mt-1 text-xs text-stone-400">Pix, dinheiro e cartões confirmados</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Contas a receber</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatReal(totalAReceber)}</p>
          <p className="mt-1 text-xs text-stone-400">Pedidos válidos ainda não pagos</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Estornos do mês</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(estornosDoMes)}</p>
          <p className="mt-1 text-xs text-stone-400">Devoluções financeiras confirmadas</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Saldo de caixa do mês</p>
          <p className={`mt-1 text-xl font-bold ${saldoDoMes >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatReal(saldoDoMes)}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Recebimentos − {formatReal(estornosDoMes)} + {formatReal(entradasManuaisDoMes)} − {formatReal(saidasManuaisDoMes)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Contas a pagar em aberto</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(totalContasAPagar)}</p>
          <Link href="/restaurante/financeiro/contas-a-pagar" className="mt-1 inline-block text-xs text-amber-700 underline underline-offset-2">
            Ver contas a pagar
          </Link>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-900 p-4">
          <p className="text-sm text-stone-300">Saldo estimado</p>
          <p className={`mt-1 text-xl font-bold ${saldoEstimado >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatReal(saldoEstimado)}
          </p>
          <p className="mt-1 text-xs text-stone-400">Recebido + a receber − contas a pagar em aberto</p>
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
