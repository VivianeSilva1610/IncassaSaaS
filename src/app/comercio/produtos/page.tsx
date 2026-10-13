import Link from "next/link";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { criarProdutoComercial, importarProdutosComercio } from "../actions";

export default async function ProdutosComercioPage({ searchParams }: { searchParams: Promise<{ sucesso?: string; erro?: string }> }) {
  const { supabase, business } = await requireCommerceAccess("produtos");
  if (!business) return null;
  const messages = await searchParams; const { data: products } = await supabase.from("commerce_products")
    .select("id,nome,sku,gtin,unidade,custo_medio,preco_venda,estoque_atual,classificacao_fiscal_status,ativo")
    .eq("business_id", business.id).order("nome");

  return <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/comercio" className="text-sm font-medium text-amber-700">← Visão geral</Link>
    <h1 className="mt-2 text-3xl font-bold text-stone-950">Produtos</h1>
    {messages.sucesso && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{messages.sucesso}</p>}{messages.erro && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{messages.erro}</p>}
    <form action={importarProdutosComercio} className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold text-amber-950">Importar produtos por CSV</h2><p className="mt-1 text-xs text-amber-800">Colunas: nome, sku, gtin, unidade, categoria, marca, preco_venda, estoque_minimo e ncm. Máximo de 500 linhas; o estoque inicial não é importado.</p></div><a href="/modelo-produtos-comercio.csv" download className="text-sm font-semibold text-amber-800 underline">Baixar modelo</a></div><div className="mt-3 flex flex-wrap gap-3"><input name="csv" type="file" accept=".csv,text/csv" required className="min-w-0 flex-1 rounded-xl border border-amber-300 bg-white p-2.5 text-sm"/><button className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white">Importar CSV</button></div></form>
    <form action={criarProdutoComercial} className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 md:grid-cols-4">
      <input name="nome" required placeholder="Nome do produto" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm md:col-span-2" />
      <input name="sku" placeholder="SKU" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
      <input name="gtin" placeholder="Código de barras" inputMode="numeric" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
      <input name="categoria" placeholder="Categoria" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
      <input name="unidade" defaultValue="UN" placeholder="Unidade" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
      <input name="preco_venda" required type="number" min="0" step="0.01" placeholder="Preço de venda" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
      <input name="estoque_minimo" type="number" min="0" step="0.001" placeholder="Estoque mínimo" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm" />
      <input name="ncm" inputMode="numeric" maxLength={8} placeholder="NCM (revisar com contador)" className="rounded-xl border border-stone-300 px-3 py-2.5 text-sm md:col-span-2" />
      <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white md:col-span-2">Cadastrar produto</button>
    </form>

    <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">Produto</th><th className="px-5 py-3">Estoque</th><th className="px-5 py-3">Custo médio</th><th className="px-5 py-3">Preço</th><th className="px-5 py-3">Fiscal</th><th className="px-5 py-3"></th></tr></thead>
      <tbody className="divide-y divide-stone-100">{(products ?? []).map(product => <tr key={product.id} className={!product.ativo ? "bg-stone-50 opacity-60" : ""}>
        <td className="px-5 py-4"><p className="font-semibold text-stone-800">{product.nome}</p><p className="text-xs text-stone-500">{product.sku || product.gtin || "Sem código"}{!product.ativo ? " · inativo" : ""}</p></td>
        <td className="px-5 py-4">{Number(product.estoque_atual)} {product.unidade}</td><td className="px-5 py-4">R$ {Number(product.custo_medio).toFixed(2)}</td><td className="px-5 py-4">R$ {Number(product.preco_venda).toFixed(2)}</td>
        <td className="px-5 py-4"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{product.classificacao_fiscal_status}</span></td>
        <td className="px-5 py-4 text-right"><Link href={`/comercio/produtos/${product.id}`} className="font-semibold text-amber-700">Editar</Link></td>
      </tr>)}</tbody>
    </table></div>{!products?.length && <p className="p-8 text-center text-sm text-stone-500">Nenhum produto cadastrado.</p>}</div>
  </div></main>;
}
