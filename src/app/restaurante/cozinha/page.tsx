import { requireRestaurantSubscription } from "@/lib/subscription";
import { updateOrderStatus } from "@/app/restaurante/actions";
import { AutoRefresh } from "@/components/delivery/AutoRefresh";

const PROXIMO_STATUS: Record<string, string> = {
  novo: "em preparo",
  "em preparo": "pronto",
  pronto: "entregue",
};

function formatHora(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function infoEmbalagem(pedido: { mesa_id: string | null; canal: string }) {
  const isDelivery = !pedido.mesa_id && ["telefone", "whatsapp", "site"].includes(pedido.canal);
  if (isDelivery) {
    return { label: "DELIVERY — ENTREGA", emoji: "📦", classe: "bg-sky-100 text-sky-800 border-sky-300" };
  }
  return { label: "PRATO — CONSUMO LOCAL", emoji: "🍽️", classe: "bg-emerald-100 text-emerald-800 border-emerald-300" };
}

export default async function CozinhaPage() {
  const { supabase } = await requireRestaurantSubscription();

  const { data: pedidos } = await supabase
    .from("del_orders")
    .select("*, del_order_items(quantidade, del_products(nome)), del_mesas(numero)")
    .in("status", ["novo", "em preparo", "pronto"])
    .order("chegou_cozinha_em", { ascending: true, nullsFirst: true });

  return (
    <div>
      <AutoRefresh seconds={15} />
      <h1 className="text-2xl font-bold text-stone-900">Cozinha</h1>
      <p className="mt-1 text-sm text-stone-600">Atualiza automaticamente a cada 15 segundos.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(pedidos ?? []).map((p) => {
          const embalagem = infoEmbalagem(p);
          return (
            <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className={`-mx-4 -mt-4 mb-3 rounded-t-xl border-b px-4 py-2 text-center text-sm font-bold ${embalagem.classe}`}>
                {embalagem.emoji} {embalagem.label}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-900">
                  {p.del_mesas?.numero
                    ? `Mesa ${p.del_mesas.numero}`
                    : p.cliente_nome
                      ? `${p.cliente_nome}${p.cliente_telefone ? ` · ${p.cliente_telefone}` : ""}`
                      : "Sem nome"}
                </p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{p.status}</span>
              </div>
              <p className="mt-1 space-x-2 text-xs text-stone-400">
                {formatHora(p.chegou_cozinha_em) && <span>Chegou {formatHora(p.chegou_cozinha_em)}</span>}
                {formatHora(p.em_preparo_em) && <span>· Em preparo {formatHora(p.em_preparo_em)}</span>}
                {formatHora(p.pronto_em) && <span>· Pronto {formatHora(p.pronto_em)}</span>}
              </p>
              <ul className="mt-2 space-y-0.5 text-sm text-stone-700">
                {(p.del_order_items ?? []).map(
                  (it: { quantidade: number; del_products: { nome: string } | null }, i: number) => (
                    <li key={i}>{it.quantidade}x {it.del_products?.nome ?? "?"}</li>
                  ),
                )}
              </ul>
              {p.endereco && <p className="mt-1 text-xs text-stone-600">📍 {p.endereco}</p>}
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
          );
        })}
        {(pedidos ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum pedido em andamento.</p>}
      </div>
    </div>
  );
}
