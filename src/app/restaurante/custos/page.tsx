import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

const MODULOS = [
  {
    href: "/restaurante/custos/fixos",
    titulo: "Custos fixos",
    descricao: "Aluguel, contas, internet, MEI, etc. — some tudo por mês.",
    icone: "🧾",
  },
  {
    href: "/restaurante/custos/entrega",
    titulo: "Entrega",
    descricao: "Taxa de entrega por bairro, com distância e pedido mínimo grátis.",
    icone: "🛵",
  },
  {
    href: "/restaurante/custos/precificacao",
    titulo: "Precificação",
    descricao: "Volume e margem desejada + ficha técnica e preço sugerido por prato.",
    icone: "💰",
  },
];

export default async function CustosPage() {
  await requireRestaurantSubscription("custos");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Custos e preço sugerido</h1>
      <p className="mt-1 text-sm text-stone-600">Custos fixos, taxas de entrega e precificação dos pratos.</p>

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
