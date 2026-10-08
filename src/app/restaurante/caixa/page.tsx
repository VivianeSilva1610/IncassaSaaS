import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addCaixaMovimento, deleteCaixaMovimento } from "@/app/restaurante/actions";
import { offsetParaData } from "@/lib/fiscal/fechamento";
import Link from "next/link";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; caixaHoje: (status: string) => string; fechado: string; aberto: string;
  fechadoPor: (email: string) => string; usuarioIdentificado: string; confiraAntes: string;
  verFechamento: string; conferirFechar: string;
  vendasCompetencia: string; pedidosEntregues: string; recebimentosDoMes: string; pagamentosConfirmados: string;
  contasAReceber: string; pedidosNaoPagos: string; estornosDoMes: string; devolucoesConfirmadas: string;
  saldoCaixaDoMes: string; contasAPagarAberto: string; verContasAPagar: string; saldoEstimado: string;
  recebidoAReceberContas: string; novoLancamento: string; saida: string; entrada: string; despesa: string;
  retirada: string; aporte: string; outro: string; valorPlaceholder: string; descricaoOpcional: string;
  registrarLancamento: string; lancamentosRecentes: string; excluir: string; nenhumLancamento: string;
}> = {
  "pt-BR": {
    titulo: "Caixa",
    descricao: "Competência usa a data de entrega; caixa usa a data do pagamento. Lance abaixo apenas movimentações que não estejam nos pedidos, evitando duplicar vendas.",
    caixaHoje: (status) => `Caixa de hoje: ${status}`, fechado: "fechado", aberto: "aberto",
    fechadoPor: (email) => `Fechado por ${email}.`, usuarioIdentificado: "usuário identificado",
    confiraAntes: "Confira os valores antes de encerrar o movimento do dia.",
    verFechamento: "Ver fechamento", conferirFechar: "Conferir e fechar caixa",
    vendasCompetencia: "Vendas por competência", pedidosEntregues: "Pedidos entregues neste mês",
    recebimentosDoMes: "Recebimentos do mês", pagamentosConfirmados: "Pix, dinheiro e cartões confirmados",
    contasAReceber: "Contas a receber", pedidosNaoPagos: "Pedidos válidos ainda não pagos",
    estornosDoMes: "Estornos do mês", devolucoesConfirmadas: "Devoluções financeiras confirmadas",
    saldoCaixaDoMes: "Saldo de caixa do mês", contasAPagarAberto: "Contas a pagar em aberto",
    verContasAPagar: "Ver contas a pagar", saldoEstimado: "Saldo estimado",
    recebidoAReceberContas: "Recebido + a receber − contas a pagar em aberto",
    novoLancamento: "Novo lançamento", saida: "Saída (despesa, retirada…)", entrada: "Entrada (aporte, outra receita…)",
    despesa: "Despesa", retirada: "Retirada", aporte: "Aporte", outro: "Outro",
    valorPlaceholder: "Valor (R$)", descricaoOpcional: "Descrição (opcional)", registrarLancamento: "Registrar lançamento",
    lancamentosRecentes: "Lançamentos recentes", excluir: "Excluir", nenhumLancamento: "Nenhum lançamento ainda.",
  },
  it: {
    titulo: "Cassa",
    descricao: "La competenza usa la data di consegna; la cassa usa la data del pagamento. Registra qui sotto solo movimenti che non sono già negli ordini, per evitare di duplicare le vendite.",
    caixaHoje: (status) => `Cassa di oggi: ${status}`, fechado: "chiusa", aberto: "aperta",
    fechadoPor: (email) => `Chiusa da ${email}.`, usuarioIdentificado: "utente identificato",
    confiraAntes: "Verifica i valori prima di chiudere il movimento del giorno.",
    verFechamento: "Vedi chiusura", conferirFechar: "Verifica e chiudi cassa",
    vendasCompetencia: "Vendite per competenza", pedidosEntregues: "Ordini consegnati questo mese",
    recebimentosDoMes: "Incassi del mese", pagamentosConfirmados: "Contanti e carte confermati",
    contasAReceber: "Crediti", pedidosNaoPagos: "Ordini validi non ancora pagati",
    estornosDoMes: "Storni del mese", devolucoesConfirmadas: "Rimborsi finanziari confermati",
    saldoCaixaDoMes: "Saldo di cassa del mese", contasAPagarAberto: "Debiti aperti",
    verContasAPagar: "Vedi debiti", saldoEstimado: "Saldo stimato",
    recebidoAReceberContas: "Incassato + da incassare − debiti aperti",
    novoLancamento: "Nuovo movimento", saida: "Uscita (spesa, prelievo…)", entrada: "Entrata (conferimento, altra entrata…)",
    despesa: "Spesa", retirada: "Prelievo", aporte: "Conferimento", outro: "Altro",
    valorPlaceholder: "Importo (EUR)", descricaoOpcional: "Descrizione (opzionale)", registrarLancamento: "Registra movimento",
    lancamentosRecentes: "Movimenti recenti", excluir: "Elimina", nenhumLancamento: "Nessun movimento ancora.",
  },
};

export default async function CaixaPage() {
  const { supabase, restaurantOwnerId, isOwner, locale } = await requireRestaurantSubscription("caixa");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";

  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = nowParts.find((part) => part.type === "year")!.value;
  const month = nowParts.find((part) => part.type === "month")!.value;
  const day = nowParts.find((part) => part.type === "day")!.value;
  const hoje = `${year}-${month}-${day}`;
  const inicioMes = `${year}-${month}-01`;
  const inicioMesIso = `${inicioMes}T00:00:00${offsetParaData(timezone, inicioMes)}`;

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
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${fechamentoHoje ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div><p className="font-semibold text-stone-900">{t.caixaHoje(fechamentoHoje ? t.fechado : t.aberto)}</p><p className="text-xs text-stone-600">{fechamentoHoje ? t.fechadoPor(fechamentoHoje.fechado_por_email || t.usuarioIdentificado) : t.confiraAntes}</p></div>
        {isOwner && <Link href={`/restaurante/fiscal/fechamento-diario?data=${hoje}`} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">{fechamentoHoje ? t.verFechamento : t.conferirFechar}</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.vendasCompetencia}</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{formatReal(vendasDoMes)}</p>
          <p className="mt-1 text-xs text-stone-400">{t.pedidosEntregues}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.recebimentosDoMes}</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatReal(recebimentosDoMes)}</p>
          <p className="mt-1 text-xs text-stone-400">{t.pagamentosConfirmados}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.contasAReceber}</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatReal(totalAReceber)}</p>
          <p className="mt-1 text-xs text-stone-400">{t.pedidosNaoPagos}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.estornosDoMes}</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(estornosDoMes)}</p>
          <p className="mt-1 text-xs text-stone-400">{t.devolucoesConfirmadas}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.saldoCaixaDoMes}</p>
          <p className={`mt-1 text-xl font-bold ${saldoDoMes >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatReal(saldoDoMes)}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {t.recebimentosDoMes} − {formatReal(estornosDoMes)} + {formatReal(entradasManuaisDoMes)} − {formatReal(saidasManuaisDoMes)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.contasAPagarAberto}</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(totalContasAPagar)}</p>
          <Link href="/restaurante/financeiro/contas-a-pagar" className="mt-1 inline-block text-xs text-amber-700 underline underline-offset-2">
            {t.verContasAPagar}
          </Link>
        </div>
        <div className="rounded-xl border border-stone-200 bg-stone-900 p-4">
          <p className="text-sm text-stone-300">{t.saldoEstimado}</p>
          <p className={`mt-1 text-xl font-bold ${saldoEstimado >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatReal(saldoEstimado)}
          </p>
          <p className="mt-1 text-xs text-stone-400">{t.recebidoAReceberContas}</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.novoLancamento}</h2>
        <form action={addCaixaMovimento} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <select name="tipo" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="saida">{t.saida}</option>
            <option value="entrada">{t.entrada}</option>
          </select>
          <select name="categoria" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="despesa">{t.despesa}</option>
            <option value="retirada">{t.retirada}</option>
            <option value="aporte">{t.aporte}</option>
            <option value="outro">{t.outro}</option>
          </select>
          <input name="valor" type="number" step="0.01" min="0" required placeholder={t.valorPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="descrizione" placeholder={t.descricaoOpcional} className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            {t.registrarLancamento}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.lancamentosRecentes}</h2>
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
                  {t.excluir}
                </button>
              </form>
            </div>
          ))}
          {(movimentos ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumLancamento}</p>}
        </div>
      </section>
    </div>
  );
}
