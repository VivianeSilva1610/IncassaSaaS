import { requireDeliveryAdmin } from "@/lib/delivery/auth";
import { addProduct, toggleProductAtivo, deleteProduct, updateOrderStatus, deleteOrder } from "@/app/delivery-admin/actions";
import { NewOrderForm } from "@/components/delivery/NewOrderForm";

function formatEuro(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

const STATUSES = ["novo", "preparazione", "pronto", "consegnato", "cancelado"];

export default async function VendasPage() {
  const { supabase } = await requireDeliveryAdmin();

  const [{ data: products }, { data: orders }] = await Promise.all([
    supabase.from("del_products").select("*").order("nome"),
    supabase
      .from("del_orders")
      .select("*, del_order_items(quantidade, preco_unitario, del_products(nome))")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const activeProducts = (products ?? []).filter((p) => p.ativo);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Vendite</h1>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">Menu</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="nome" required placeholder="Nome prodotto" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="preco" type="number" step="0.01" min="0" required placeholder="Prezzo (€)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="descrizione" placeholder="Descrizione (opzionale)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            Aggiungi prodotto
          </button>
        </form>

        <div className="mt-3 space-y-1.5">
          {(products ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span className={p.ativo ? "text-stone-900" : "text-stone-400 line-through"}>
                {p.nome} — {formatEuro(Number(p.preco))}
              </span>
              <div className="flex items-center gap-3">
                <form action={toggleProductAtivo.bind(null, p.id, p.ativo)}>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    {p.ativo ? "Disattiva" : "Attiva"}
                  </button>
                </form>
                <form action={deleteProduct.bind(null, p.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(products ?? []).length === 0 && <p className="text-sm text-stone-500">Nessun prodotto ancora.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Nuovo ordine</h2>
        <NewOrderForm products={activeProducts.map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco) }))} />
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Ordini recenti</h2>
        <div className="mt-2 space-y-2">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">{o.cliente_nome || "Cliente senza nome"}</p>
                  <p className="text-sm text-stone-500">
                    {(o.del_order_items ?? [])
                      .map((it: { quantidade: number; del_products: { nome: string } | null }) =>
                        `${it.quantidade}x ${it.del_products?.nome ?? "?"}`,
                      )
                      .join(", ")}
                  </p>
                  {o.note && <p className="mt-1 text-xs italic text-stone-500">{o.note}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-stone-900">{formatEuro(Number(o.totale))}</p>
                  <p className="text-xs text-stone-400">{o.canal}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await updateOrderStatus(o.id, String(formData.get("status")));
                  }}
                  className="flex items-center gap-2"
                >
                  <select name="status" defaultValue={o.status} className="rounded-md border border-stone-300 px-2 py-1 text-xs">
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    Aggiorna stato
                  </button>
                </form>
                <form action={deleteOrder.bind(null, o.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(orders ?? []).length === 0 && <p className="text-sm text-stone-500">Nessun ordine ancora.</p>}
        </div>
      </section>
    </div>
  );
}
