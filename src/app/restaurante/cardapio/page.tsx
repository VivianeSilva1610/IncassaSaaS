import { requireRestaurantSubscription } from "@/lib/subscription";
import { addProduct, deleteProduct, addCardapioDia, removeCardapioDia } from "@/app/restaurante/actions";

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function CardapioPage() {
  const { supabase } = await requireRestaurantSubscription("cardapio");

  const [{ data: products }, { data: cardapioSemana }] = await Promise.all([
    supabase.from("del_products").select("*").order("nome"),
    supabase.from("del_cardapio_semana").select("*, del_products(nome)").order("dia_semana"),
  ]);

  const tamanhos = (products ?? []).filter((p) => p.categoria === "tamanho");
  // Pratos já cadastrados como "prato" (menu normal) também valem como
  // principal do Monte seu Pranzo — não precisa recadastrar.
  const principais = (products ?? []).filter((p) => p.categoria === "principal" || p.categoria === "prato");
  const acompanhamentos = (products ?? []).filter((p) => p.categoria === "acompanhamento");
  const extras = (products ?? []).filter((p) => p.categoria === "extra");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Cardápio — Monte seu Pranzo</h1>
      <p className="mt-1 text-sm text-stone-600">
        Defina os tamanhos de marmitex, os pratos principais, acompanhamentos e extras. Depois monte a
        agenda da semana dizendo quais principais estão disponíveis em cada dia.
      </p>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">Tamanhos de marmitex</h2>
        <p className="mt-1 text-xs text-stone-500">Ex: Marmitex M — R$18,00 — 3 acompanhamentos inclusos.</p>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <input type="hidden" name="categoria" value="tamanho" />
          <input name="nome" required placeholder="Nome (ex: Marmitex M)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="preco" type="number" step="0.01" min="0" required placeholder="Preço (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="max_acompanhamentos" type="number" step="1" min="1" required placeholder="Qtd. acompanhamentos" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-3">
            Adicionar tamanho
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {tamanhos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome} — {formatReal(Number(p.preco))} — {p.max_acompanhamentos} acompanhamentos</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
              </form>
            </div>
          ))}
          {tamanhos.length === 0 && <p className="text-sm text-stone-500">Nenhum tamanho cadastrado ainda.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Pratos principais</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="principal" />
          <input name="nome" required placeholder="Nome (ex: Polpette al Sugo)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            Adicionar principal
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {principais.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
              </form>
            </div>
          ))}
          {principais.length === 0 && <p className="text-sm text-stone-500">Nenhum principal cadastrado ainda.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Acompanhamentos</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="acompanhamento" />
          <input name="nome" required placeholder="Nome (ex: Arroz branco)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            Adicionar acompanhamento
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {acompanhamentos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
              </form>
            </div>
          ))}
          {acompanhamentos.length === 0 && <p className="text-sm text-stone-500">Nenhum acompanhamento cadastrado ainda.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Extras (cobrados à parte)</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="extra" />
          <input name="nome" required placeholder="Nome (ex: Polpetta extra)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="preco" type="number" step="0.01" min="0" required placeholder="Preço (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            Adicionar extra
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {extras.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome} — {formatReal(Number(p.preco))}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
              </form>
            </div>
          ))}
          {extras.length === 0 && <p className="text-sm text-stone-500">Nenhum extra cadastrado ainda.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Cardápio da semana</h2>
        <p className="mt-1 text-xs text-stone-500">Quais principais estão disponíveis em cada dia — repete toda semana.</p>
        <div className="mt-2 space-y-3">
          {DIAS_SEMANA.map((label, diaSemana) => {
            const itensDoDia = (cardapioSemana ?? []).filter((c) => c.dia_semana === diaSemana);
            return (
              <div key={diaSemana} className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-medium text-stone-900">{label}</h3>
                <div className="mt-2 space-y-1">
                  {itensDoDia.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm text-stone-600">
                      <span>{c.del_products?.nome ?? "?"}</span>
                      <form action={removeCardapioDia.bind(null, c.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">Remover</button>
                      </form>
                    </div>
                  ))}
                  {itensDoDia.length === 0 && <p className="text-sm text-stone-500">Nenhum principal definido.</p>}
                </div>
                <form action={addCardapioDia} className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                  <input type="hidden" name="dia_semana" value={diaSemana} />
                  <select name="product_id" required className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                    <option value="">Principal…</option>
                    {principais.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
                    Adicionar a este dia
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
