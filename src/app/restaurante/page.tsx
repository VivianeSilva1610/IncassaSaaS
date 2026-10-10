import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { offsetParaData } from "@/lib/fiscal/fechamento";

const LABEL_MODULO: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": {
    compras: "Compras", estoque: "Estoque", vendas: "Vendas", cardapio: "Menu do site", cozinha: "Cozinha",
    custos: "Custos", caixa: "Caixa", financeiro: "Financeiro", gestao: "Gestão",
  },
  it: {
    compras: "Acquisti", estoque: "Magazzino", vendas: "Vendite", cardapio: "Menu del sito", cozinha: "Cucina",
    custos: "Costi", caixa: "Cassa", financeiro: "Finanza", gestao: "Gestione",
  },
};

const STATUS_LABEL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { novo: "novo", "em preparo": "em preparo", pronto: "pronto", entregue: "entregue", cancelado: "cancelado" },
  it: { novo: "nuovo", "em preparo": "in preparazione", pronto: "pronto", entregue: "consegnato", cancelado: "annullato" },
};

const CONTEUDO: Record<RestauranteLocale, {
  seusModulos: string; atalhos: string; nenhumModulo: string; visaoGeral: string; vendasCompetencia: string;
  recebimentosMes: string; estornadoMes: (valor: string) => string; ingredientesEmFalta: string;
  paraRepor: string; minimo: (valor: number) => string; irParaEstoque: string; ultimosPedidos: string;
  clienteSemNome: string; nenhumPedido: string; irParaVendas: string;
}> = {
  "pt-BR": {
    seusModulos: "Seus módulos", atalhos: "Atalhos pra onde você tem acesso.",
    nenhumModulo: "Nenhum módulo liberado ainda — peça pro dono do restaurante.",
    visaoGeral: "Visão geral", vendasCompetencia: "Vendas por competência", recebimentosMes: "Recebimentos deste mês",
    estornadoMes: (valor) => `${valor} estornado no mês`, ingredientesEmFalta: "Ingredientes abaixo do estoque mínimo",
    paraRepor: "Para repor", minimo: (valor) => `mínimo ${valor}`, irParaEstoque: "Ir para o estoque",
    ultimosPedidos: "Últimos pedidos", clienteSemNome: "Cliente sem nome", nenhumPedido: "Nenhum pedido ainda.",
    irParaVendas: "Ir para vendas",
  },
  it: {
    seusModulos: "I tuoi moduli", atalhos: "Scorciatoie per ciò a cui hai accesso.",
    nenhumModulo: "Nessun modulo abilitato ancora — chiedi al proprietario del ristorante.",
    visaoGeral: "Panoramica", vendasCompetencia: "Vendite per competenza", recebimentosMes: "Incassi di questo mese",
    estornadoMes: (valor) => `${valor} stornato nel mese`, ingredientesEmFalta: "Ingredienti sotto la scorta minima",
    paraRepor: "Da riassortire", minimo: (valor) => `minimo ${valor}`, irParaEstoque: "Vai al magazzino",
    ultimosPedidos: "Ultimi ordini", clienteSemNome: "Cliente senza nome", nenhumPedido: "Nessun ordine ancora.",
    irParaVendas: "Vai alle vendite",
  },
};

export default async function RestauranteOverviewPage() {
  const { supabase, isOwner, modulosPermitidos, locale } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];
  const labelModulo = LABEL_MODULO[locale];
  const statusLabel = STATUS_LABEL[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";

  // Vendas, recebimentos e os últimos pedidos são informação financeira do
  // negócio inteiro — só o dono vê essa tela completa. Quem tem acesso
  // restrito (ex: só Cozinha) cai numa landing simples com atalho só pros
  // módulos liberados pra ela.
  if (!isOwner) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{t.seusModulos}</h1>
        <p className="mt-1 text-sm text-stone-600">{t.atalhos}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {modulosPermitidos.map((modulo) => (
            <Link
              key={modulo}
              href={`/restaurante/${modulo === "cardapio" ? "cardapio/produtos" : modulo}`}
              className="rounded-xl border border-stone-200 bg-white p-4 text-sm font-medium text-stone-900 hover:border-amber-300"
            >
              {labelModulo[modulo] ?? modulo}
            </Link>
          ))}
          {modulosPermitidos.length === 0 && (
            <p className="text-sm text-stone-500">{t.nenhumModulo}</p>
          )}
        </div>
      </div>
    );
  }

  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = nowParts.find((part) => part.type === "year")!.value;
  const month = nowParts.find((part) => part.type === "month")!.value;
  const inicioMesData = `${year}-${month}-01`;
  const inicioMes = `${inicioMesData}T00:00:00${offsetParaData(timezone, inicioMesData)}`;

  const [{ data: ingredients }, { data: recentOrders }, { data: monthSales }, { data: monthReceipts }, { data: monthRefunds }] = await Promise.all([
    supabase.from("del_ingredients").select("id, nome, quantidade_atual, estoque_minimo, unidade"),
    supabase
      .from("del_orders")
      .select("id, cliente_nome, totale, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("del_orders")
      .select("totale")
      .gte("competencia_em", inicioMes)
      .neq("status", "cancelado"),
    supabase
      .from("del_orders")
      .select("totale, valor_pago")
      .eq("pago", true)
      .gte("pago_em", inicioMes),
    supabase
      .from("del_pagamento_eventos")
      .select("valor_movimento")
      .eq("status", "confirmado")
      .gt("valor_movimento", 0)
      .gte("ocorrido_em", inicioMes),
  ]);

  const ingredientesEmFalta = (ingredients ?? []).filter(
    (i) => i.estoque_minimo != null && Number(i.quantidade_atual) <= Number(i.estoque_minimo),
  );
  const totalMes = (monthSales ?? []).reduce((sum, o) => sum + Number(o.totale), 0);
  const recebidoMes = (monthReceipts ?? []).reduce((sum, o) => sum + Number(o.valor_pago ?? o.totale), 0);
  const estornadoMes = (monthRefunds ?? []).reduce((sum, e) => sum + Number(e.valor_movimento), 0);
  const orderCount = (monthSales ?? []).length;
  const statusTone: Record<string, string> = {
    novo: "bg-blue-50 text-blue-700 ring-blue-600/10",
    "em preparo": "bg-amber-50 text-amber-700 ring-amber-600/10",
    pronto: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    entregue: "bg-stone-100 text-stone-600 ring-stone-500/10",
    cancelado: "bg-red-50 text-red-700 ring-red-600/10",
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">{locale === "it" ? "Dashboard" : "Painel operacional"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">{t.visaoGeral}</h1>
          <p className="mt-1 text-sm text-stone-500">{locale === "it" ? "I numeri essenziali del tuo ristorante, in un unico posto." : "Os números essenciais do seu restaurante, em um só lugar."}</p>
        </div>
        <Link href="/restaurante/vendas/novo" className="inline-flex h-10 items-center justify-center rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700">
          <span className="mr-2 text-lg font-light">+</span>{locale === "it" ? "Nuovo ordine" : "Novo pedido"}
        </Link>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.vendasCompetencia, value: formatReal(totalMes), accent: "text-stone-950", icon: "↗" },
          { label: t.recebimentosMes, value: formatReal(recebidoMes - estornadoMes), accent: "text-emerald-700", icon: "✓" },
          { label: locale === "it" ? "Ordini del mese" : "Pedidos no mês", value: String(orderCount), accent: "text-stone-950", icon: "#" },
          { label: t.ingredientesEmFalta, value: String(ingredientesEmFalta.length), accent: ingredientesEmFalta.length ? "text-amber-700" : "text-stone-950", icon: "!" },
        ].map(card => <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
          <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-stone-500">{card.label}</p><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-500">{card.icon}</span></div>
          <p className={`mt-4 text-2xl font-bold tracking-tight ${card.accent}`}>{card.value}</p>
          {card.label === t.recebimentosMes && estornadoMes > 0 && <p className="mt-1 text-xs text-red-600">{t.estornadoMes(formatReal(estornadoMes))}</p>}
        </div>)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
            <div><h2 className="font-semibold text-stone-900">{t.ultimosPedidos}</h2><p className="mt-0.5 text-xs text-stone-500">{locale === "it" ? "Attività più recente" : "Atividade mais recente"}</p></div>
            <Link href="/restaurante/vendas" className="text-xs font-semibold text-amber-700 hover:text-amber-800">{t.irParaVendas} →</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {(recentOrders ?? []).map(o => <div key={o.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-800">{o.cliente_nome || t.clienteSemNome}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusTone[o.status] ?? "bg-stone-100 text-stone-600 ring-stone-500/10"}`}>{statusLabel[o.status] ?? o.status}</span></div>
              <p className="shrink-0 text-sm font-semibold text-stone-700">{formatReal(Number(o.totale))}</p>
            </div>)}
            {(recentOrders ?? []).length === 0 && <p className="px-6 py-10 text-center text-sm text-stone-500">{t.nenhumPedido}</p>}
          </div>
        </section>

        <section className={`rounded-2xl border p-5 shadow-[0_1px_2px_rgba(28,25,23,0.03)] ${ingredientesEmFalta.length ? "border-amber-200 bg-amber-50/70" : "border-stone-200 bg-white"}`}>
          <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold ${ingredientesEmFalta.length ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{ingredientesEmFalta.length ? "!" : "✓"}</span><div><h2 className="font-semibold text-stone-900">{t.paraRepor}</h2><p className="text-xs text-stone-500">{ingredientesEmFalta.length ? `${ingredientesEmFalta.length} ${locale === "it" ? "articoli richiedono attenzione" : "itens precisam de atenção"}` : (locale === "it" ? "Scorte sotto controllo" : "Estoque sob controle")}</p></div></div>
          {ingredientesEmFalta.length > 0 && <ul className="mt-5 space-y-3">{ingredientesEmFalta.slice(0, 5).map(i => <li key={i.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-stone-700">{i.nome}</span><span className="shrink-0 text-xs text-stone-500">{Number(i.quantidade_atual)} {i.unidade}</span></li>)}</ul>}
          <Link href="/restaurante/estoque" className="mt-5 inline-flex text-xs font-semibold text-amber-700 hover:text-amber-800">{t.irParaEstoque} →</Link>
        </section>
      </div>
    </div>
  );
}
