import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { calcularMetricasPeriodo } from "@/lib/delivery/gestao";
import { offsetParaData } from "@/lib/fiscal/fechamento";

function fimDoMesNoFuso(ano: number, mes: number, timeZone: string): string {
  const proxMes = mes === 12 ? 1 : mes + 1;
  const proxAno = mes === 12 ? ano + 1 : ano;
  const inicioProxMes = `${proxAno}-${String(proxMes).padStart(2, "0")}-01`;
  return new Date(new Date(`${inicioProxMes}T00:00:00${offsetParaData(timeZone, inicioProxMes)}`).getTime() - 1).toISOString();
}

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: (n: number) => string; quantosMeses: string; atualizar: string;
  mes: string; pedidos: string; receita: string; ticketMedio: string; cmv: string; margem: string; lucroEstimado: string;
  rodape: string;
}> = {
  "pt-BR": {
    voltar: "← Gestão", titulo: "Comparativo mensal", descricao: (n) => `Últimos ${n} meses, lado a lado.`,
    quantosMeses: "Quantos meses", atualizar: "Atualizar", mes: "Mês", pedidos: "Pedidos", receita: "Receita",
    ticketMedio: "Ticket médio", cmv: "CMV", margem: "Margem", lucroEstimado: "Lucro estimado",
    rodape: "CMV e lucro estimado usam o custo de ingrediente vigente em cada mês (quando cadastrado) e os custos fixos atuais rateados pelos dias do mês — não são valores fiscais, é uma estimativa gerencial.",
  },
  it: {
    voltar: "← Gestione", titulo: "Confronto mensile", descricao: (n) => `Ultimi ${n} mesi, affiancati.`,
    quantosMeses: "Quanti mesi", atualizar: "Aggiorna", mes: "Mese", pedidos: "Ordini", receita: "Ricavi",
    ticketMedio: "Scontrino medio", cmv: "Costo del venduto", margem: "Margine", lucroEstimado: "Profitto stimato",
    rodape: "Il costo del venduto e il profitto stimato usano il costo dell'ingrediente vigente in ogni mese (quando registrato) e i costi fissi attuali ripartiti sui giorni del mese — non sono valori fiscali, è una stima gestionale.",
  },
};

export default async function GestaoComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{ qtd?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("gestao");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const params = await searchParams;
  const quantidade = Math.min(Math.max(Number(params.qtd) || 6, 1), 24);

  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const anoAtual = Number(partes.find((p) => p.type === "year")!.value);
  const mesAtual = Number(partes.find((p) => p.type === "month")!.value);

  const meses: { label: string; ano: number; mes: number }[] = [];
  for (let i = quantidade - 1; i >= 0; i--) {
    let mes = mesAtual - i;
    let ano = anoAtual;
    while (mes <= 0) {
      mes += 12;
      ano -= 1;
    }
    meses.push({ label: `${String(mes).padStart(2, "0")}/${ano}`, ano, mes });
  }

  const linhas = await Promise.all(
    meses.map(async (m) => {
      const inicioMes = `${m.ano}-${String(m.mes).padStart(2, "0")}-01`;
      const de = `${inicioMes}T00:00:00${offsetParaData(timezone, inicioMes)}`;
      const ate = fimDoMesNoFuso(m.ano, m.mes, timezone);
      const atéLimitado = new Date(ate) > new Date() ? new Date().toISOString() : ate;
      const metricas = await calcularMetricasPeriodo(supabase, restaurantOwnerId, de, atéLimitado);
      return { label: m.label, metricas };
    }),
  );

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao(quantidade)}</p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.quantosMeses}</span>
          <input name="qtd" type="number" min="1" max="24" defaultValue={quantidade} className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {t.atualizar}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
              <th className="py-2 pr-3">{t.mes}</th>
              <th className="py-2 pr-3">{t.pedidos}</th>
              <th className="py-2 pr-3">{t.receita}</th>
              <th className="py-2 pr-3">{t.ticketMedio}</th>
              <th className="py-2 pr-3">{t.cmv}</th>
              <th className="py-2 pr-3">{t.margem}</th>
              <th className="py-2 pr-3">{t.lucroEstimado}</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ label, metricas }) => (
              <tr key={label} className="border-b border-stone-100">
                <td className="py-2 pr-3 font-medium text-stone-900">{label}</td>
                <td className="py-2 pr-3 text-stone-600">{metricas.pedidos}</td>
                <td className="py-2 pr-3 text-stone-900">{formatReal(metricas.receita)}</td>
                <td className="py-2 pr-3 text-stone-600">{formatReal(metricas.ticketMedio)}</td>
                <td className="py-2 pr-3 text-red-600">{formatReal(metricas.cmv)}</td>
                <td className="py-2 pr-3 text-emerald-700">{formatReal(metricas.margem)}</td>
                <td className={`py-2 pr-3 font-medium ${metricas.lucroEstimado >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {formatReal(metricas.lucroEstimado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-stone-500">
        {t.rodape}
      </p>
    </div>
  );
}
