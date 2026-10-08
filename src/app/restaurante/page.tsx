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

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.visaoGeral}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.vendasCompetencia}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(totalMes)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.recebimentosMes}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{formatReal(recebidoMes - estornadoMes)}</p>
          {estornadoMes > 0 && <p className="mt-1 text-xs text-red-600">{t.estornadoMes(formatReal(estornadoMes))}</p>}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.ingredientesEmFalta}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{ingredientesEmFalta.length}</p>
        </div>
      </div>

      {ingredientesEmFalta.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-stone-900">{t.paraRepor}</h2>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            {ingredientesEmFalta.map((i) => (
              <li key={i.id}>
                {i.nome}: {Number(i.quantidade_atual)} {i.unidade} ({t.minimo(Number(i.estoque_minimo))})
              </li>
            ))}
          </ul>
          <Link href="/restaurante/estoque" className="mt-2 inline-block text-sm text-amber-700 underline underline-offset-2">
            {t.irParaEstoque}
          </Link>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.ultimosPedidos}</h2>
        <div className="mt-2 space-y-2">
          {(recentOrders ?? []).map((o) => (
            <div key={o.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">{o.cliente_nome || t.clienteSemNome}</span>
                <span className="text-stone-500">{formatReal(Number(o.totale))}</span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{statusLabel[o.status] ?? o.status}</p>
            </div>
          ))}
          {(recentOrders ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumPedido}</p>}
        </div>
        <Link href="/restaurante/vendas" className="mt-2 inline-block text-sm text-amber-700 underline underline-offset-2">
          {t.irParaVendas}
        </Link>
      </div>
    </div>
  );
}
