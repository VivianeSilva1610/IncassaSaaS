import Link from "next/link";
import { requireCommerceAccess } from "@/lib/commerce-subscription";
import { criarEmpresaComercial } from "./actions";

export default async function ComercioPage() {
  const { supabase, business } = await requireCommerceAccess();

  if (!business) {
    return <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">INCASSA Comércio</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">Sua operação comercial começa aqui</h1>
      <p className="mt-3 max-w-xl text-stone-600">A base para produtos, fornecedores, compras, entrada por NF-e e estoque já está preparada. O cadastro da empresa será a próxima etapa do onboarding.</p>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">O módulo fiscal inicia sempre em homologação e exige revisão das configurações pelo contador responsável.</div>
      <form action={criarEmpresaComercial} className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">Razão social ou nome<input name="nome" required className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-stone-700">Nome fantasia<input name="nome_fantasia" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-stone-700">CNPJ<input name="cnpj" inputMode="numeric" placeholder="Somente números" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal" /></label>
        <label className="text-sm font-medium text-stone-700">UF<input name="uf" maxLength={2} placeholder="MG" className="mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-2.5 font-normal uppercase" /></label>
        <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white sm:col-span-2">Criar minha empresa comercial</button>
      </form>
    </main>;
  }

  const [{ count: products }, { count: pendingEntries }, { count: lowStock }] = await Promise.all([
    supabase.from("commerce_products").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("ativo", true),
    supabase.from("commerce_stock_entries").select("id", { count: "exact", head: true }).eq("business_id", business.id).in("status", ["rascunho", "conferida"]),
    supabase.from("commerce_products").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("ativo", true).lte("estoque_atual", 0),
  ]);

  return <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">INCASSA Comércio</p>
      <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="text-3xl font-bold tracking-tight text-stone-950">{business.nome_fantasia || business.nome}</h1><p className="mt-1 text-sm text-stone-500">Visão geral da sua operação de revenda.</p></div>
        <div className="flex gap-2"><Link href="/comercio/produtos" className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700">Produtos</Link><Link href="/comercio/entradas" className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">Entradas</Link></div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["Produtos ativos", products ?? 0], ["Entradas a conferir", pendingEntries ?? 0], ["Estoque zerado", lowStock ?? 0]].map(([label, value]) => <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-sm font-medium text-stone-500">{label}</p><p className="mt-3 text-3xl font-bold text-stone-950">{value}</p></div>)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-6"><h2 className="font-semibold text-stone-900">Entradas de mercadoria</h2><p className="mt-2 text-sm leading-6 text-stone-600">Registre uma compra manualmente ou importe o XML da NF-e. As duas origens passam por conferência antes de movimentar o estoque.</p></section>
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6"><h2 className="font-semibold text-blue-950">Fiscal com revisão profissional</h2><p className="mt-2 text-sm leading-6 text-blue-800">Regras versionadas por vigência e fonte oficial, com status de revisão pelo contador. Nenhuma classificação será tratada como definitiva automaticamente.</p></section>
      </div>
    </div>
  </main>;
}
