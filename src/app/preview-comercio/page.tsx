import { notFound } from "next/navigation";

const cards = [["Vendas hoje", "R$ 3.842,70", "↗"], ["Pedidos", "47", "#"], ["Ticket médio", "R$ 81,76", "◇"], ["Estoque baixo", "8", "!"]];
const products = [["Cafeteira Elétrica 220V", "CF-220", "12 un.", "R$ 189,90"], ["Jogo de Panelas 5 peças", "JP-005", "7 un.", "R$ 349,00"], ["Liquidificador Premium", "LQ-900", "3 un.", "R$ 279,90"]];

export default function PreviewComercioPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <main className="min-h-screen bg-[#f7f7f5] text-stone-900">
    <div className="grid min-h-screen lg:grid-cols-[256px_1fr]">
      <aside className="hidden border-r border-stone-200 bg-white p-5 lg:block"><p className="text-xs font-bold tracking-[0.18em] text-amber-600">INCASSA</p><p className="mt-1 font-semibold">Comércio Modelo</p><nav className="mt-8 space-y-1 text-sm">{["Visão geral", "Vendas", "Produtos", "Estoque", "Entradas", "Compras", "Clientes", "Financeiro", "Fiscal", "Equipe"].map((item, index) => <div key={item} className={`rounded-xl px-3 py-2.5 ${index === 0 ? "bg-amber-50 font-semibold text-amber-800" : "text-stone-600"}`}>{item}</div>)}</nav></aside>
      <div><header className="border-b border-stone-200 bg-white/90 px-6 py-4"><p className="text-xs font-bold uppercase tracking-wider text-stone-400">Demonstração local</p><p className="font-semibold">Loja Central</p></header><div className="mx-auto max-w-7xl p-5 sm:p-8">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Prévia sem login e sem dados reais. Esta rota retorna 404 em produção.</div>
        <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">Painel comercial</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Visão geral</h1></div><button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">+ Nova venda</button></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, icon]) => <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex justify-between text-sm text-stone-500"><span>{label}</span><span>{icon}</span></div><p className="mt-4 text-2xl font-bold">{value}</p></div>)}</div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]"><section className="overflow-hidden rounded-2xl border border-stone-200 bg-white"><div className="border-b border-stone-100 px-5 py-4"><h2 className="font-semibold">Produtos em atenção</h2></div>{products.map(([name, sku, stock, price]) => <div key={sku} className="flex items-center justify-between gap-4 border-b border-stone-100 px-5 py-4 last:border-0"><div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-stone-500">{sku}</p></div><div className="text-right"><p className="text-sm font-semibold">{price}</p><p className="text-xs text-amber-700">{stock}</p></div></div>)}</section><section className="rounded-2xl border border-stone-200 bg-white p-5"><h2 className="font-semibold">Ações rápidas</h2><div className="mt-4 grid gap-2">{["Abrir PDV", "Importar NF-e", "Nova compra", "Cadastrar produto", "Conferir estoque"].map(item => <button key={item} className="rounded-xl border border-stone-200 px-3 py-2.5 text-left text-sm font-medium text-stone-700">{item}</button>)}</div></section></div>
      </div></div>
    </div>
  </main>;
}
