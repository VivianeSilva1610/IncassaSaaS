import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function RestauranteOverviewPage() {
  const { supabase } = await requireRestaurantSubscription();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: ingredients }, { data: recentOrders }, { data: monthOrders }] = await Promise.all([
    supabase.from("del_ingredients").select("id, nome, quantidade_atual, estoque_minimo, unidade"),
    supabase
      .from("del_orders")
      .select("id, cliente_nome, totale, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("del_orders").select("totale").gte("created_at", startOfMonth.toISOString()),
  ]);

  const ingredientesEmFalta = (ingredients ?? []).filter(
    (i) => i.estoque_minimo != null && Number(i.quantidade_atual) <= Number(i.estoque_minimo),
  );
  const totalMes = (monthOrders ?? []).reduce((sum, o) => sum + Number(o.totale), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Visão geral</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Vendas deste mês</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(totalMes)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Ingredientes abaixo do estoque mínimo</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{ingredientesEmFalta.length}</p>
        </div>
      </div>

      {ingredientesEmFalta.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-stone-900">Para repor</h2>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            {ingredientesEmFalta.map((i) => (
              <li key={i.id}>
                {i.nome}: {Number(i.quantidade_atual)} {i.unidade} (mínimo {Number(i.estoque_minimo)})
              </li>
            ))}
          </ul>
          <Link href="/restaurante/estoque" className="mt-2 inline-block text-sm text-amber-700 underline underline-offset-2">
            Ir para o estoque
          </Link>
        </div>
      )}

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">Últimos pedidos</h2>
        <div className="mt-2 space-y-2">
          {(recentOrders ?? []).map((o) => (
            <div key={o.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-stone-900">{o.cliente_nome || "Cliente sem nome"}</span>
                <span className="text-stone-500">{formatReal(Number(o.totale))}</span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{o.status}</p>
            </div>
          ))}
          {(recentOrders ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum pedido ainda.</p>}
        </div>
        <Link href="/restaurante/vendas" className="mt-2 inline-block text-sm text-amber-700 underline underline-offset-2">
          Ir para vendas
        </Link>
      </div>
    </div>
  );
}
