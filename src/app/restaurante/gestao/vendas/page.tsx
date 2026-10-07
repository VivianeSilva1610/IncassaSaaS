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

const LABEL_CANAL: Record<string, string> = {
  site: "Loja online",
  mesa: "Mesa",
  pdv: "Balcão",
  telefone: "Telefone",
};

export default async function GestaoVendasPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string }>;
}) {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("gestao");
  const params = await searchParams;
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicioMesSP();
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hojeSP();

  const metricas = await calcularMetricasPeriodo(supabase, restaurantOwnerId, `${de}T00:00:00-03:00`, `${ate}T23:59:59.999-03:00`);
  const maisVendidos = [...metricas.produtos].slice(0, 15);

  return (
    <div>
      <Link href="/restaurante/gestao" className="text-sm text-amber-700 underline underline-offset-2">
        ← Gestão
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Vendas</h1>
      <p className="mt-1 text-sm text-stone-600">Por competência (data de entrega do pedido).</p>

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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Receita no período</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(metricas.receita)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Pedidos</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{metricas.pedidos}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Ticket médio</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(metricas.ticketMedio)}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">Vendas por canal</h2>
        <div className="mt-2 space-y-2">
          {metricas.vendasPorCanal.map((c) => (
            <div key={c.canal} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <span className="font-medium text-stone-900">{LABEL_CANAL[c.canal] ?? c.canal}</span>
              <span className="text-stone-500">
                {formatReal(c.receita)} · {c.pedidos} pedido{c.pedidos === 1 ? "" : "s"}
              </span>
            </div>
          ))}
          {metricas.vendasPorCanal.length === 0 && <p className="text-sm text-stone-500">Nenhuma venda no período.</p>}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">Produtos mais vendidos</h2>
        <div className="mt-2 space-y-2">
          {maisVendidos.map((p) => (
            <div key={p.productId} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div>
                <p className="font-medium text-stone-900">{p.nome}</p>
                {p.categoria && <p className="text-xs text-stone-400">{p.categoria}</p>}
              </div>
              <span className="text-stone-500">
                {p.quantidade}x · {formatReal(p.receita)}
              </span>
            </div>
          ))}
          {maisVendidos.length === 0 && <p className="text-sm text-stone-500">Nenhuma venda no período.</p>}
        </div>
      </div>
    </div>
  );
}
