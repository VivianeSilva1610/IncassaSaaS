import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

const MODULOS = [
  {
    href: "/restaurante/estoque/produtos",
    titulo: "Produtos",
    descricao: "Cadastre novos ingredientes, edite, exclua e registre entradas/saídas/ajustes.",
    icone: "📦",
  },
  {
    href: "/restaurante/estoque/compras",
    titulo: "Compra de fornecedor",
    descricao: "Informe uma compra: soma ao estoque de um produto existente ou cadastra um novo.",
    icone: "🧾",
  },
  {
    href: "/restaurante/estoque/compras-nfe",
    titulo: "Compras e fornecedores (NF-e)",
    descricao: "Importe o XML da NF-e recebida, classifique os itens e acompanhe por fornecedor.",
    icone: "📥",
  },
  {
    href: "/restaurante/estoque/relatorio",
    titulo: "Relatório",
    descricao: "Quantidade final por período (mensal ou anual), com entradas/saídas — CSV ou Excel.",
    icone: "📊",
  },
];

export default async function EstoquePage() {
  await requireRestaurantSubscription("estoque");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Estoque</h1>
      <p className="mt-1 text-sm text-stone-600">
        Ingredientes e matérias-primas do restaurante.
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
