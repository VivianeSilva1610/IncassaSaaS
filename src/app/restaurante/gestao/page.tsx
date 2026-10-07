import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

const MODULOS = [
  {
    href: "/restaurante/gestao/vendas",
    titulo: "Vendas",
    descricao: "Vendas por produto e por canal, produtos mais vendidos e ticket médio.",
    icone: "📈",
  },
  {
    href: "/restaurante/gestao/margem",
    titulo: "Margem e CMV",
    descricao: "Margem por prato, custo da mercadoria vendida e lucro estimado do período.",
    icone: "💰",
  },
  {
    href: "/restaurante/gestao/comparativo",
    titulo: "Comparativo mensal",
    descricao: "Receita, CMV, margem e lucro estimado lado a lado, mês a mês.",
    icone: "📊",
  },
  {
    href: "/restaurante/gestao/desperdicio",
    titulo: "Desperdício",
    descricao: "Perdas registradas no estoque (manual ou por inventário), valorizadas pelo custo da época.",
    icone: "🗑️",
  },
];

export default async function GestaoPage() {
  await requireRestaurantSubscription("gestao");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Gestão</h1>
      <p className="mt-1 text-sm text-stone-600">
        Relatórios gerenciais do restaurante, calculados a partir dos pedidos, fichas técnicas e custos já
        cadastrados.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {MODULOS.map((modulo) => (
          <Link
            key={modulo.href}
            href={modulo.href}
            className="group rounded-xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-sm"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl text-amber-700">
                {modulo.icone}
              </span>
              <div>
                <h2 className="font-semibold text-stone-900 group-hover:text-amber-800">{modulo.titulo}</h2>
                <p className="mt-1 text-sm leading-5 text-stone-500">{modulo.descricao}</p>
                <span className="mt-3 inline-block text-xs font-medium text-amber-700">Abrir módulo →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
