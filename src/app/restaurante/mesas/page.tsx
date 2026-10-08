import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addMesa, deleteMesa, fecharComanda } from "@/app/restaurante/actions";

function formatMoney(value: number, locale: RestauranteLocale) {
  return locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const FORMAS_PAGAMENTO: Record<RestauranteLocale, { value: string; label: string }[]> = {
  "pt-BR": [
    { value: "dinheiro", label: "Dinheiro" }, { value: "cartao_debito", label: "Cartão de débito" },
    { value: "cartao_credito", label: "Cartão de crédito" }, { value: "pix", label: "Pix" },
  ],
  it: [
    { value: "contanti", label: "Contanti" }, { value: "carta_debito", label: "Carta di debito" },
    { value: "carta_credito", label: "Carta di credito" }, { value: "altro", label: "Altro" },
  ],
};

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; numeroPlaceholder: string; criarMesa: string; abrirCardapio: string;
  excluirMesa: string; comandaAberta: (total: string) => string; fecharComanda: string; nenhumaComanda: string;
  nenhumaMesa: string;
}> = {
  "pt-BR": {
    titulo: "Mesas",
    descricao: "Cada mesa tem um QR code próprio — o cliente escaneia, vê o cardápio e manda o pedido direto pra cozinha. A comanda vai acumulando até você fechar na hora do pagamento.",
    numeroPlaceholder: "Número ou nome da mesa (ex: Mesa 3)", criarMesa: "Criar mesa", abrirCardapio: "Abrir cardápio",
    excluirMesa: "Excluir mesa", comandaAberta: (total) => `Comanda aberta — ${total}`,
    fecharComanda: "Fechar comanda (pagamento recebido)", nenhumaComanda: "Nenhuma comanda aberta.",
    nenhumaMesa: "Nenhuma mesa cadastrada ainda.",
  },
  it: {
    titulo: "Tavoli",
    descricao: "Ogni tavolo ha un proprio QR code — il cliente lo scansiona, vede il menu e invia l'ordine direttamente in cucina. Il conto accumula finché non lo chiudi al momento del pagamento.",
    numeroPlaceholder: "Numero o nome del tavolo (es: Tavolo 3)", criarMesa: "Crea tavolo", abrirCardapio: "Apri menu",
    excluirMesa: "Elimina tavolo", comandaAberta: (total) => `Conto aperto — ${total}`,
    fecharComanda: "Chiudi conto (pagamento ricevuto)", nenhumaComanda: "Nessun conto aperto.",
    nenhumaMesa: "Nessun tavolo registrato ancora.",
  },
};

export default async function MesasPage() {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("vendas");
  const t = CONTEUDO[locale];
  const formasPagamento = FORMAS_PAGAMENTO[locale];
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
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <form action={addMesa} className="mt-6 flex gap-2 rounded-xl border border-stone-200 bg-white p-4">
        <input name="numero" required placeholder={t.numeroPlaceholder} className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {t.criarMesa}
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
                      {t.abrirCardapio}
                    </a>
                  </div>
                </div>
                <form action={deleteMesa.bind(null, m.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluirMesa}</button>
                </form>
              </div>

              {comanda ? (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <p className="text-sm font-medium text-amber-700">{t.comandaAberta(formatMoney(totalComanda, locale))}</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                    {itensComanda.map((it: { quantidade: number; del_products: { nome: string } | null }, i: number) => (
                      <li key={i}>{it.quantidade}x {it.del_products?.nome ?? "?"}</li>
                    ))}
                  </ul>
                  <form action={fecharComanda.bind(null, comanda.id)} className="mt-2 flex flex-wrap items-center gap-2">
                    <select name="forma_pagamento" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                      {formasPagamento.map((forma) => <option key={forma.value} value={forma.value}>{forma.label}</option>)}
                    </select>
                    <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
                      {t.fecharComanda}
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-3 border-t border-stone-100 pt-3 text-xs text-stone-500">{t.nenhumaComanda}</p>
              )}
            </div>
          );
        })}
        {(mesas ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumaMesa}</p>}
      </div>
    </div>
  );
}
