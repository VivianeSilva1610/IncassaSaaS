import { requireRestaurantSubscription } from "@/lib/subscription";
import { updateOrderStatus } from "@/app/restaurante/actions";
import { AutoRefresh } from "@/components/delivery/AutoRefresh";

const PROXIMO_STATUS: Record<string, string> = {
  novo: "em preparo",
  "em preparo": "pronto",
  pronto: "entregue",
};

export default async function CozinhaPage() {
  const { supabase } = await requireRestaurantSubscription();

  const { data: pedidos } = await supabase
    .from("del_orders")
    .select("*, del_order_items(quantidade, del_products(nome)), del_mesas(numero)")
    .in("status", ["novo", "em preparo", "pronto"])
    .order("created_at");

  return (
    <div>
      <AutoRefresh seconds={15} />
      <h1 className="text-2xl font-bold text-stone-900">Cozinha</h1>
      <p className="mt-1 text-sm text-stone-600">Atualiza automaticamente a cada 15 segundos.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(pedidos ?? []).map((p) => (
          <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-stone-900">
                {p.del_mesas?.numero ? `Mesa ${p.del_mesas.numero}` : p.cliente_nome || "Balcão/Delivery"}
              </p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{p.status}</span>
            </div>
            <ul className="mt-2 space-y-0.5 text-sm text-stone-700">
              {(p.del_order_items ?? []).map(
                (it: { quantidade: number; del_products: { nome: string } | null }, i: number) => (
                  <li key={i}>{it.quantidade}x {it.del_products?.nome ?? "?"}</li>
                ),
              )}
            </ul>
            {p.note && <p className="mt-1 text-xs italic text-stone-500">{p.note}</p>}
            {PROXIMO_STATUS[p.status] && (
              <form
                action={async () => {
                  "use server";
                  await updateOrderStatus(p.id, PROXIMO_STATUS[p.status]);
                }}
                className="mt-3"
              >
                <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                  Marcar como {PROXIMO_STATUS[p.status]}
                </button>
              </form>
            )}
          </div>
        ))}
        {(pedidos ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum pedido em andamento.</p>}
      </div>
    </div>
  );
}
