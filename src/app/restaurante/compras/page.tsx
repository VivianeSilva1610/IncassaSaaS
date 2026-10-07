import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

export default async function ComprasPage() {
  await requireRestaurantSubscription("compras");
  return <div><h1 className="text-2xl font-bold text-stone-900">Compras</h1><p className="mt-1 text-sm text-stone-600">Planejamento, autorização e emissão de pedidos aos fornecedores.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><Link href="/restaurante/compras/pedidos" className="rounded-xl border border-stone-200 bg-white p-5 hover:border-amber-300"><span className="text-xl">📝</span><h2 className="mt-3 font-semibold text-stone-900">Pedidos de compra</h2><p className="mt-1 text-sm text-stone-500">Crie rascunhos, autorize e imprima pedidos para fornecedores.</p></Link></div></div>;
}

