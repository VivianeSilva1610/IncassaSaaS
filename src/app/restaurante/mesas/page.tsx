import { requireRestaurantSubscription } from "@/lib/subscription";
import { addMesa, deleteMesa, fecharComanda } from "@/app/restaurante/actions";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function MesasPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [{ data: mesas }, { data: comandasAbertas }] = await Promise.all([
    supabase.from("del_mesas").select("*").order("numero"),
    supabase
      .from("del_comandas")
      .select("*, del_orders(totale, status, del_order_items(quantidade, preco_unitario, del_products(nome)))")
      .eq("owner_id", restaurantOwnerId)
      .eq("status", "aberta"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Mesas</h1>
      <p className="mt-1 text-sm text-stone-600">
        Cada mesa tem um QR code próprio — o cliente escaneia, vê o cardápio e manda o pedido direto
        pra cozinha. A comanda vai acumulando até você fechar na hora do pagamento.
      </p>

      <form action={addMesa} className="mt-6 flex gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input name="numero" required placeholder="Número ou nome da mesa (ex: Mesa 3)" className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Criar mesa
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {(mesas ?? []).map((m) => {
          const mesaUrl = `${siteUrl}/mesa/${m.qr_token}`;
          const comanda = (comandasAbertas ?? []).find((c) => c.mesa_id === m.id);
          const itensComanda = comanda
            ? (comanda.del_orders ?? []).flatMap((o: { del_order_items: { quantidade: number; del_products: { nome: string } | null }[] }) => o.del_order_items ?? [])
            : [];
          const totalComanda = comanda
            ? (comanda.del_orders ?? []).reduce((sum: number, o: { totale: number }) => sum + Number(o.totale), 0)
            : 0;

          return (
            <div key={m.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(mesaUrl)}`}
                    alt={`QR code da ${m.numero}`}
                    width={90}
                    height={90}
                    className="rounded-md border border-stone-200"
                  />
                  <div>
                    <p className="font-semibold text-stone-900">{m.numero}</p>
                    <a href={mesaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-700 underline underline-offset-2">
                      Abrir cardápio
                    </a>
                  </div>
                </div>
                <form action={deleteMesa.bind(null, m.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Excluir mesa</button>
                </form>
              </div>

              {comanda ? (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <p className="text-sm font-medium text-amber-700">Comanda aberta — {formatReal(totalComanda)}</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                    {itensComanda.map((it: { quantidade: number; del_products: { nome: string } | null }, i: number) => (
                      <li key={i}>{it.quantidade}x {it.del_products?.nome ?? "?"}</li>
                    ))}
                  </ul>
                  <form action={fecharComanda.bind(null, comanda.id)} className="mt-2 flex flex-wrap items-center gap-2">
                    <select name="forma_pagamento" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão</option>
                      <option value="pix">Pix</option>
                    </select>
                    <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                      Fechar comanda (pagamento recebido)
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-500">Nenhuma comanda aberta.</p>
              )}
            </div>
          );
        })}
        {(mesas ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma mesa cadastrada ainda.</p>}
      </div>
    </div>
  );
}
