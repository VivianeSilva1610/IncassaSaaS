import { requireRestaurantSubscription } from "@/lib/subscription";
import { addProduct, updateProduct, toggleProductAtivo, deleteProduct, updateOrderStatus, deleteOrder } from "@/app/restaurante/actions";
import { NewOrderForm } from "@/components/delivery/NewOrderForm";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const STATUSES = ["novo", "em preparo", "pronto", "entregue", "cancelado"];

export default async function VendasPage() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  const [{ data: products }, { data: orders }, { data: pricingConfig }, { data: cardapioSemana }] = await Promise.all([
    supabase.from("del_products").select("*").order("nome"),
    supabase
      .from("del_orders")
      .select("*, del_order_items(quantidade, preco_unitario, del_products(nome))")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("del_pricing_config").select("nome_negocio").eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_cardapio_semana").select("dia_semana, product_id"),
  ]);

  const activeProducts = (products ?? []).filter((p) => p.ativo);
  const nomeNegocio = pricingConfig?.nome_negocio;

  const itensAvulsos = activeProducts
    .filter((p) => p.categoria === "prato" || p.categoria === "bebida" || p.categoria === "sobremesa")
    .map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco) }));
  const tamanhos = activeProducts
    .filter((p) => p.categoria === "tamanho")
    .map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco), maxAcompanhamentos: Number(p.max_acompanhamentos ?? 0) }));
  const principais = activeProducts
    .filter((p) => p.categoria === "principal" || p.categoria === "prato")
    .map((p) => ({ id: p.id, nome: p.nome, preco: 0 }));
  const acompanhamentos = activeProducts
    .filter((p) => p.categoria === "acompanhamento")
    .map((p) => ({ id: p.id, nome: p.nome, preco: 0 }));
  const extras = activeProducts
    .filter((p) => p.categoria === "extra")
    .map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco) }));
  const cardapioSemanaMapeado = (cardapioSemana ?? []).map((c) => ({ diaSemana: c.dia_semana, productId: c.product_id }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Vendas</h1>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">{nomeNegocio ? `${nomeNegocio} — Menu` : "Menu"}</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="nome" required placeholder="Nome do item" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="preco" type="number" step="0.01" min="0" required placeholder="Preço (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <select name="categoria" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="prato">Prato</option>
            <option value="bebida">Bebida</option>
            <option value="sobremesa">Sobremesa</option>
          </select>
          <input name="descrizione" placeholder="Descrição (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            Adicionar ao menu
          </button>
        </form>

        {([
          ["prato", "Pratos"],
          ["bebida", "Bebidas"],
          ["sobremesa", "Sobremesas"],
        ] as const).map(([categoria, label]) => {
          const itensDaCategoria = (products ?? []).filter((p) => (p.categoria ?? "prato") === categoria);
          if (itensDaCategoria.length === 0) return null;
          return (
            <div key={categoria} className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">{label}</p>
              <div className="mt-1.5 space-y-1.5">
                {itensDaCategoria.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                    <span className={p.ativo ? "text-stone-900" : "text-stone-400 line-through"}>
                      {p.nome} — {formatReal(Number(p.preco))}
                      {p.descrizione && <span className="block text-xs text-stone-500">{p.descrizione}</span>}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <details className="relative">
                        <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                          Editar
                        </summary>
                        <form
                          action={updateProduct.bind(null, p.id)}
                          className="absolute right-0 z-10 mt-2 grid w-64 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                        >
                          <input name="nome" required defaultValue={p.nome} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                          <input
                            name="preco"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            defaultValue={p.preco}
                            className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                          />
                          <select name="categoria" defaultValue={p.categoria ?? "prato"} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">
                            <option value="prato">Prato</option>
                            <option value="bebida">Bebida</option>
                            <option value="sobremesa">Sobremesa</option>
                          </select>
                          <input
                            name="descrizione"
                            defaultValue={p.descrizione ?? ""}
                            placeholder="Descrição"
                            className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                          />
                          <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                            Salvar
                          </button>
                        </form>
                      </details>
                      <form action={toggleProductAtivo.bind(null, p.id, p.ativo)}>
                        <button type="submit" className="text-xs text-amber-700 hover:underline">
                          {p.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </form>
                      <form action={deleteProduct.bind(null, p.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(products ?? []).length === 0 && <p className="mt-3 text-sm text-stone-500">Nenhum item no menu ainda.</p>}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Novo pedido</h2>
        <NewOrderForm
          products={itensAvulsos}
          tamanhos={tamanhos}
          principais={principais}
          acompanhamentos={acompanhamentos}
          extras={extras}
          cardapioSemana={cardapioSemanaMapeado}
          isOwner={isOwner}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Pedidos recentes</h2>
        <div className="mt-2 space-y-2">
          {(orders ?? []).map((o) => (
            <div key={o.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">
                    {o.cliente_nome || "Cliente sem nome"}
                    {o.a_prazo && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        A prazo{o.invoice_id ? " · fatura no INCASSA" : ""}
                      </span>
                    )}
                  </p>
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
                  <p className="font-semibold text-stone-900">{formatReal(Number(o.totale))}</p>
                  {Number(o.taxa_entrega) > 0 && (
                    <p className="text-xs text-stone-500">+ {formatReal(Number(o.taxa_entrega))} entrega</p>
                  )}
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
                    Atualizar status
                  </button>
                </form>
                <form action={deleteOrder.bind(null, o.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
          {(orders ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum pedido ainda.</p>}
        </div>
      </section>
    </div>
  );
}
