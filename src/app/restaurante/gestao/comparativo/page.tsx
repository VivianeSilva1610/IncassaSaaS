import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { calcularMetricasPeriodo } from "@/lib/delivery/gestao";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fimDoMesSP(ano: number, mes: number): string {
  const proxMes = mes === 12 ? 1 : mes + 1;
  const proxAno = mes === 12 ? ano + 1 : ano;
  return new Date(new Date(`${proxAno}-${String(proxMes).padStart(2, "0")}-01T00:00:00-03:00`).getTime() - 1).toISOString();
}

export default async function GestaoComparativoPage({
  searchParams,
}: {
  searchParams: Promise<{ qtd?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("gestao");
  const params = await searchParams;
  const quantidade = Math.min(Math.max(Number(params.qtd) || 6, 1), 24);

  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
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
      const de = `${m.ano}-${String(m.mes).padStart(2, "0")}-01T00:00:00-03:00`;
      const ate = fimDoMesSP(m.ano, m.mes);
      const atéLimitado = new Date(ate) > new Date() ? new Date().toISOString() : ate;
      const metricas = await calcularMetricasPeriodo(supabase, restaurantOwnerId, de, atéLimitado);
      return { label: m.label, metricas };
    }),
  );

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
        ← Gestão
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Comparativo mensal</h1>
      <p className="mt-1 text-sm text-stone-600">Últimos {quantidade} meses, lado a lado.</p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Quantos meses</span>
          <input name="qtd" type="number" min="1" max="24" defaultValue={quantidade} className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Atualizar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
              <th className="py-2 pr-3">Mês</th>
              <th className="py-2 pr-3">Pedidos</th>
              <th className="py-2 pr-3">Receita</th>
              <th className="py-2 pr-3">Ticket médio</th>
              <th className="py-2 pr-3">CMV</th>
              <th className="py-2 pr-3">Margem</th>
              <th className="py-2 pr-3">Lucro estimado</th>
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
        CMV e lucro estimado usam o custo de ingrediente vigente em cada mês (quando cadastrado) e os custos
        fixos atuais rateados pelos dias do mês — não são valores fiscais, é uma estimativa gerencial.
      </p>
    </div>
  );
}
