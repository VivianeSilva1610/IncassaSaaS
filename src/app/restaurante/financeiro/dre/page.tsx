import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { calcularMetricasPeriodo } from "@/lib/delivery/gestao";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function hojeSP(): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  return `${partes.find((p) => p.type === "year")!.value}-${partes.find((p) => p.type === "month")!.value}-${partes.find((p) => p.type === "day")!.value}`;
}

function inicioMesSP(): string {
  return `${hojeSP().slice(0, 7)}-01`;
}

function Linha({ label, value, destaque, negativo }: { label: string; value: number; destaque?: boolean; negativo?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${destaque ? "border-t border-stone-300 pt-3" : ""}`}>
      <span className={destaque ? "font-semibold text-stone-900" : "text-stone-600"}>{label}</span>
      <span className={`${destaque ? "text-lg font-bold" : ""} ${negativo ? "text-red-600" : destaque ? (value >= 0 ? "text-emerald-700" : "text-red-600") : "text-stone-900"}`}>
        {negativo && value > 0 ? "− " : ""}
        {formatReal(Math.abs(value))}
      </span>
    </div>
  );
}

export default async function DrePage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("financeiro");
  const params = await searchParams;
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesSP();
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hojeSP();

  const m = await calcularMetricasPeriodo(supabase, restaurantOwnerId, `${de}T00:00:00-03:00`, `${ate}T23:59:59.999-03:00`);

  return (
    <div>
      <Link href="/restaurante/financeiro" className="text-sm text-amber-700 underline underline-offset-2">
        ← Financeiro
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">DRE gerencial</h1>
      <p className="mt-1 text-sm text-stone-600">
        Demonstração de resultado estimada, por competência (data de entrega do pedido). Não é um documento
        contábil ou fiscal — é uma leitura gerencial pra acompanhar se o restaurante está dando lucro.
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">De</span>
          <input name="de" type="date" defaultValue={de} max={hojeSP()} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">Até</span>
          <input name="ate" type="date" defaultValue={ate} max={hojeSP()} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Atualizar
        </button>
      </form>

      {m.cmvComDadosParciais && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Algum produto vendido não tem ficha técnica completa — o CMV abaixo não inclui esses itens, então o
          resultado real tende a ser um pouco pior do que o mostrado aqui.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <Linha label="Receita bruta de vendas" value={m.receita} />
        <Linha label="(−) Estornos" value={m.estornos} negativo />
        <Linha label="= Receita líquida" value={m.receitaLiquida} destaque />

        <Linha label="(−) CMV (custo da mercadoria vendida)" value={m.cmv} negativo />
        <Linha label="= Margem de contribuição" value={m.margem} destaque />

        <Linha label="(−) Custos fixos (rateio do período)" value={m.custosFixosNoPeriodo} negativo />
        <Linha label="= Resultado estimado" value={m.lucroEstimado} destaque />
      </div>

      <p className="mt-4 text-xs text-stone-500">
        Custos fixos vêm do cadastro em Custos, rateados pelos dias do período selecionado. Não inclui
        impostos nem despesas avulsas pagas via Contas a pagar que não sejam fixas — pra isso, veja Contas a
        pagar e Caixa.
      </p>
    </div>
  );
}
