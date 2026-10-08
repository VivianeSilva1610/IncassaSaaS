import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; totalAReceber: string; totalAPagar: string;
  periodo: string; colAReceber: string; colAPagar: string; saldoPeriodo: string; saldoAcumulado: string;
  vencido: string; nenhumaConta: string; vencidoExplicacao: (contasPagar: React.ReactNode, contasReceber: React.ReactNode) => React.ReactNode;
}> = {
  "pt-BR": {
    voltar: "← Financeiro", titulo: "Fluxo de caixa projetado",
    descricao: "Contas a receber e a pagar em aberto, por mês de vencimento — não inclui o saldo de caixa que você já tem hoje, só o que ainda vai entrar e sair.",
    totalAReceber: "Total a receber em aberto", totalAPagar: "Total a pagar em aberto",
    periodo: "Período", colAReceber: "A receber", colAPagar: "A pagar", saldoPeriodo: "Saldo do período",
    saldoAcumulado: "Saldo acumulado", vencido: "Vencido", nenhumaConta: "Nenhuma conta em aberto no momento.",
    vencidoExplicacao: (contasPagar, contasReceber) => <>&quot;Vencido&quot; junta tudo que já passou do vencimento e ainda não foi marcado como pago/recebido — vale a pena revisar em {contasPagar} e {contasReceber}.</>,
  },
  it: {
    voltar: "← Finanza", titulo: "Flusso di cassa proiettato",
    descricao: "Crediti e debiti aperti, per mese di scadenza — non include il saldo di cassa che hai già oggi, solo quello che deve ancora entrare e uscire.",
    totalAReceber: "Totale crediti aperti", totalAPagar: "Totale debiti aperti",
    periodo: "Periodo", colAReceber: "Da incassare", colAPagar: "Da pagare", saldoPeriodo: "Saldo del periodo",
    saldoAcumulado: "Saldo accumulato", vencido: "Scaduto", nenhumaConta: "Nessun conto aperto al momento.",
    vencidoExplicacao: (contasPagar, contasReceber) => <>&quot;Scaduto&quot; raggruppa tutto ciò che è oltre la scadenza e non è ancora stato segnato come pagato/incassato — vale la pena rivedere in {contasPagar} e {contasReceber}.</>,
  },
};

function bucketDe(dataVencimento: string, hoje: string, vencidoLabel: string): string {
  return dataVencimento < hoje ? vencidoLabel : dataVencimento.slice(0, 7);
}

function labelBucket(bucket: string, vencidoLabel: string): string {
  if (bucket === vencidoLabel) return vencidoLabel;
  const [ano, mes] = bucket.split("-");
  return `${mes}/${ano}`;
}

function hojeNoFuso(timeZone: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

export default async function FluxoCaixaPage() {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("financeiro");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const hoje = hojeNoFuso(timezone);

  const [{ data: aReceber }, { data: aPagar }] = await Promise.all([
    supabase.from("del_contas_a_receber").select("valor, data_vencimento").eq("owner_id", restaurantOwnerId).eq("status", "aberta"),
    supabase.from("del_contas_a_pagar").select("valor, data_vencimento").eq("owner_id", restaurantOwnerId).eq("status", "a_pagar"),
  ]);

  const buckets = new Map<string, { entradas: number; saidas: number }>();
  for (const c of aReceber ?? []) {
    const b = bucketDe(c.data_vencimento, hoje, t.vencido);
    const atual = buckets.get(b) ?? { entradas: 0, saidas: 0 };
    atual.entradas += Number(c.valor);
    buckets.set(b, atual);
  }
  for (const c of aPagar ?? []) {
    const b = bucketDe(c.data_vencimento, hoje, t.vencido);
    const atual = buckets.get(b) ?? { entradas: 0, saidas: 0 };
    atual.saidas += Number(c.valor);
    buckets.set(b, atual);
  }

  const chaves = [...buckets.keys()].sort((a, b) => {
    if (a === t.vencido) return -1;
    if (b === t.vencido) return 1;
    return a.localeCompare(b);
  });

  const linhas = chaves.reduce<{ chave: string; entradas: number; saidas: number; saldo: number; acumulado: number }[]>(
    (acc, chave) => {
      const { entradas, saidas } = buckets.get(chave)!;
      const saldo = entradas - saidas;
      const acumuladoAnterior = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
      acc.push({ chave, entradas, saidas, saldo, acumulado: acumuladoAnterior + saldo });
      return acc;
    },
    [],
  );

  const totalAReceber = (aReceber ?? []).reduce((sum, c) => sum + Number(c.valor), 0);
  const totalAPagar = (aPagar ?? []).reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <div>
      <Link href="/restaurante/financeiro" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.totalAReceber}</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatReal(totalAReceber)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{t.totalAPagar}</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatReal(totalAPagar)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
              <th className="py-2 pr-3">{t.periodo}</th>
              <th className="py-2 pr-3">{t.colAReceber}</th>
              <th className="py-2 pr-3">{t.colAPagar}</th>
              <th className="py-2 pr-3">{t.saldoPeriodo}</th>
              <th className="py-2 pr-3">{t.saldoAcumulado}</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave} className={`border-b border-stone-100 ${l.chave === t.vencido ? "bg-red-50" : ""}`}>
                <td className="py-2 pr-3 font-medium text-stone-900">{labelBucket(l.chave, t.vencido)}</td>
                <td className="py-2 pr-3 text-emerald-700">{formatReal(l.entradas)}</td>
                <td className="py-2 pr-3 text-red-600">{formatReal(l.saidas)}</td>
                <td className={`py-2 pr-3 ${l.saldo >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatReal(l.saldo)}</td>
                <td className={`py-2 pr-3 font-semibold ${l.acumulado >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatReal(l.acumulado)}</td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-stone-500">
                  {t.nenhumaConta}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-stone-500">
        {t.vencidoExplicacao(
          <Link href="/restaurante/financeiro/contas-a-pagar" className="text-amber-700 underline underline-offset-2">
            {locale === "it" ? "Debiti" : "Contas a pagar"}
          </Link>,
          <Link href="/restaurante/financeiro/contas-a-receber" className="text-amber-700 underline underline-offset-2">
            {locale === "it" ? "Crediti" : "Contas a receber"}
          </Link>,
        )}
      </p>
    </div>
  );
}
