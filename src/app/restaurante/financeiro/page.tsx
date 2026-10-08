import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

const MODULOS = [
  {
    href: "/restaurante/financeiro/contas-a-receber",
    titulo: "Contas a receber",
    descricao: "Pedidos vendidos a prazo, vencimento e cobrança por WhatsApp.",
    icone: "↙",
  },
  {
    href: "/restaurante/financeiro/contas-a-pagar",
    titulo: "Contas a pagar",
    descricao: "Fornecedores e outras contas com vencimento, pra saber o que falta pagar.",
    icone: "↗",
  },
  {
    href: "/restaurante/financeiro/dre",
    titulo: "DRE gerencial",
    descricao: "Receita, estornos, CMV e custos fixos num resultado estimado por período.",
    icone: "📄",
  },
  {
    href: "/restaurante/financeiro/fluxo-caixa",
    titulo: "Fluxo de caixa",
    descricao: "Contas a pagar e a receber em aberto, projetadas mês a mês.",
    icone: "📅",
  },
  {
    href: "/restaurante/financeiro/estornos",
    titulo: "Estornos",
    descricao: "Histórico de todo estorno (manual ou Pix via Asaas), com motivo e valor.",
    icone: "↩",
  },
];

export default async function FinanceiroPage() {
  await requireRestaurantSubscription("financeiro");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Financeiro</h1>
      <p className="mt-1 text-sm text-stone-600">
        Contas a pagar e a receber do restaurante. Pra fluxo de caixa do dia a dia, veja a aba Caixa.
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
