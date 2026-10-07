import {
  addProduct,
  deleteProduct,
  toggleProductAtivo,
  toggleProductVisivelSite,
  updateProduct,
} from "@/app/restaurante/actions";
import { requireRestaurantSubscription } from "@/lib/subscription";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const CATEGORIAS = [["prato", "Pratos"], ["bebida", "Bebidas"], ["sobremesa", "Sobremesas"]] as const;

function formatReal(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ProdutosOnlinePage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { data: products } = await supabase
    .from("del_products")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .in("categoria", ["prato", "bebida", "sobremesa"])
    .order("nome");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Menu do site</h1>
      <p className="mt-1 text-sm text-stone-600">Cadastre os pratos que seus clientes encontrarão e comprarão na loja online.</p>

      <form action={addProduct} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome do produto" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="preco" type="number" step="0.01" min="0" required placeholder="Preço (R$)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="categoria" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="prato">Prato</option><option value="bebida">Bebida</option><option value="sobremesa">Sobremesa</option>
        </select>
        <input name="descrizione" placeholder="Descrição" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 sm:col-span-2">Adicionar ao menu online</button>
      </form>

      {CATEGORIAS.map(([categoria, titulo]) => {
        const itens = (products ?? []).filter((produto) => produto.categoria === categoria);
        if (!itens.length) return null;
        return (
          <section key={categoria} className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{titulo}</h2>
            <div className="mt-2 space-y-2">
              {itens.map((produto) => (
                <article key={produto.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {produto.imagem_url && <img src={produto.imagem_url} alt={produto.nome} className="h-12 w-12 rounded-lg object-cover" />}
                    <div className={produto.ativo ? "" : "text-stone-400 line-through"}>
                      <p className="font-medium">{produto.nome} — {formatReal(Number(produto.preco))}</p>
                      {produto.descrizione && <p className="text-xs text-stone-500">{produto.descrizione}</p>}
                      <p className="text-xs text-stone-400">
                        {produto.visivel_site === false ? "Oculto no site" : produto.dias_site?.length ? `Publicado: ${produto.dias_site.map((dia: number) => DIAS[dia]).join(", ")}` : "Publicado todos os dias"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <details className="relative">
                      <summary className="cursor-pointer list-none text-xs text-amber-700">Editar</summary>
                      <form action={updateProduct.bind(null, produto.id)} className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                        <input name="nome" required defaultValue={produto.nome} className="rounded-md border px-2 py-1.5 text-sm" />
                        <input name="preco" type="number" step="0.01" min="0" required defaultValue={produto.preco} className="rounded-md border px-2 py-1.5 text-sm" />
                        <select name="categoria" defaultValue={produto.categoria} className="rounded-md border px-2 py-1.5 text-sm">
                          <option value="prato">Prato</option><option value="bebida">Bebida</option><option value="sobremesa">Sobremesa</option>
                        </select>
                        <input name="descrizione" defaultValue={produto.descrizione ?? ""} placeholder="Descrição" className="rounded-md border px-2 py-1.5 text-sm" />
                        <fieldset><legend className="text-[11px] text-stone-500">Dias no site (nenhum = todos)</legend><div className="mt-1 flex flex-wrap gap-2">
                          {DIAS.map((label, dia) => <label key={dia} className="flex items-center gap-1 text-xs"><input type="checkbox" name="dias_site" value={dia} defaultChecked={(produto.dias_site ?? []).includes(dia)} />{label}</label>)}
                        </div></fieldset>
                        <button className="rounded-md bg-stone-900 px-3 py-1.5 text-xs text-white">Salvar</button>
                      </form>
                    </details>
                    <form action={toggleProductVisivelSite.bind(null, produto.id, produto.visivel_site !== false)}><button className="text-xs text-amber-700">{produto.visivel_site === false ? "Publicar" : "Ocultar"}</button></form>
                    <form action={toggleProductAtivo.bind(null, produto.id, produto.ativo)}><button className="text-xs text-amber-700">{produto.ativo ? "Desativar" : "Ativar"}</button></form>
                    <form action={deleteProduct.bind(null, produto.id)}><button className="text-xs text-red-600">Excluir</button></form>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {(products ?? []).length === 0 && <p className="mt-6 text-sm text-stone-500">Nenhum prato cadastrado para o site.</p>}
    </div>
  );
}
