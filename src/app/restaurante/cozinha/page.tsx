import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { updateOrderStatus } from "@/app/restaurante/actions";
import { AutoRefresh } from "@/components/delivery/AutoRefresh";

const PROXIMO_STATUS: Record<string, string> = {
  novo: "em preparo",
  "em preparo": "pronto",
  pronto: "entregue",
};

const STATUS_LABEL: Record<RestauranteLocale, Record<string, string>> = {
  "pt-BR": { novo: "novo", "em preparo": "em preparo", pronto: "pronto", entregue: "entregue" },
  it: { novo: "nuovo", "em preparo": "in preparazione", pronto: "pronto", entregue: "consegnato" },
};

function formatHora(iso: string | null, intlLocale: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" });
}

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; atualiza: string; delivery: string; consumoLocal: string; semNome: string;
  chegou: string; emPreparo: string; pronto: string; marcarComo: string; nenhumPedido: string;
}> = {
  "pt-BR": {
    titulo: "Cozinha", atualiza: "Atualiza automaticamente a cada 15 segundos.",
    delivery: "DELIVERY — ENTREGA", consumoLocal: "PRATO — CONSUMO LOCAL", semNome: "Sem nome",
    chegou: "Chegou", emPreparo: "Em preparo", pronto: "Pronto", marcarComo: "Marcar como",
    nenhumPedido: "Nenhum pedido em andamento.",
  },
  it: {
    titulo: "Cucina", atualiza: "Si aggiorna automaticamente ogni 15 secondi.",
    delivery: "CONSEGNA A DOMICILIO", consumoLocal: "PIATTO — CONSUMO SUL POSTO", semNome: "Senza nome",
    chegou: "Arrivato", emPreparo: "In preparazione", pronto: "Pronto", marcarComo: "Segna come",
    nenhumPedido: "Nessun ordine in corso.",
  },
};

function infoEmbalagem(pedido: { mesa_id: string | null; canal: string }, t: (typeof CONTEUDO)["pt-BR"]) {
  const isDelivery = !pedido.mesa_id && ["telefone", "whatsapp", "site"].includes(pedido.canal);
  if (isDelivery) {
    return { label: t.delivery, emoji: "📦", classe: "bg-sky-100 text-sky-800 border-sky-300" };
  }
  return { label: t.consumoLocal, emoji: "🍽️", classe: "bg-emerald-100 text-emerald-800 border-emerald-300" };
}

export default async function CozinhaPage() {
  const { supabase, locale } = await requireRestaurantSubscription("cozinha");
  const t = CONTEUDO[locale];
  const statusLabel = STATUS_LABEL[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";

  const { data: pedidos } = await supabase
    .from("del_orders")
    .select("*, del_order_items(quantidade, del_products(nome)), del_mesas(numero)")
    .in("status", ["novo", "em preparo", "pronto"])
    .order("chegou_cozinha_em", { ascending: true, nullsFirst: true });

  return (
    <div>
      <AutoRefresh seconds={15} />
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.atualiza}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(pedidos ?? []).map((p) => {
          const embalagem = infoEmbalagem(p, t);
          return (
            <div key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className={`-mx-4 -mt-4 mb-3 rounded-t-xl border-b px-4 py-2 text-center text-sm font-bold ${embalagem.classe}`}>
                {embalagem.emoji} {embalagem.label}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-900">
                  {p.del_mesas?.numero
                    ? `${locale === "it" ? "Tavolo" : "Mesa"} ${p.del_mesas.numero}`
                    : p.cliente_nome
                      ? `${p.cliente_nome}${p.cliente_telefone ? ` · ${p.cliente_telefone}` : ""}`
                      : t.semNome}
                </p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{statusLabel[p.status] ?? p.status}</span>
              </div>
              <p className="mt-1 space-x-2 text-xs text-stone-400">
                {formatHora(p.chegou_cozinha_em, intlLocale) && <span>{t.chegou} {formatHora(p.chegou_cozinha_em, intlLocale)}</span>}
                {formatHora(p.em_preparo_em, intlLocale) && <span>· {t.emPreparo} {formatHora(p.em_preparo_em, intlLocale)}</span>}
                {formatHora(p.pronto_em, intlLocale) && <span>· {t.pronto} {formatHora(p.pronto_em, intlLocale)}</span>}
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
                    {t.marcarComo} {statusLabel[PROXIMO_STATUS[p.status]] ?? PROXIMO_STATUS[p.status]}
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {(pedidos ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumPedido}</p>}
      </div>
    </div>
  );
}
