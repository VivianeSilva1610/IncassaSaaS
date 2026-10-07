import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

export default async function ComprasPage() {
  await requireRestaurantSubscription("compras");
  const modulos = [
    { href: "/restaurante/compras/pedidos", icone: "📝", titulo: "Pedidos de compra", descricao: "Crie rascunhos, autorize e imprima pedidos para fornecedores." },
    { href: "/restaurante/compras/fornecedor", icone: "🧾", titulo: "Compra de fornecedor", descricao: "Registre uma compra manual e a entrada dos materiais recebidos." },
    { href: "/restaurante/compras/nfe", icone: "📥", titulo: "Compras e fornecedores (NF-e)", descricao: "Importe o XML, confira os itens, fornecedores, parcelas e recebimento." },
  ];
  return <div><h1 className="text-2xl font-bold text-stone-900">Compras</h1><p className="mt-1 text-sm text-stone-600">Planejamento, autorização, fornecedores e recebimento de compras.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{modulos.map((modulo) => <Link key={modulo.href} href={modulo.href} className="rounded-xl border border-stone-200 bg-white p-5 hover:border-amber-300"><span className="text-xl">{modulo.icone}</span><h2 className="mt-3 font-semibold text-stone-900">{modulo.titulo}</h2><p className="mt-1 text-sm text-stone-500">{modulo.descricao}</p></Link>)}</div></div>;
}
