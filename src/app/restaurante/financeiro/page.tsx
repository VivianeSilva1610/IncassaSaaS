import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; subtitulo: string; abrir: string;
  modulos: { href: string; titulo: string; descricao: string; icone: string }[];
}> = {
  "pt-BR": {
    titulo: "Financeiro", subtitulo: "Contas a pagar e a receber do restaurante. Pra fluxo de caixa do dia a dia, veja a aba Caixa.", abrir: "Abrir módulo →",
    modulos: [
      { href: "/restaurante/financeiro/contas-a-receber", titulo: "Contas a receber", descricao: "Pedidos vendidos a prazo, vencimento e cobrança por WhatsApp.", icone: "↙" },
      { href: "/restaurante/financeiro/contas-a-pagar", titulo: "Contas a pagar", descricao: "Fornecedores e outras contas com vencimento, pra saber o que falta pagar.", icone: "↗" },
      { href: "/restaurante/financeiro/dre", titulo: "DRE gerencial", descricao: "Receita, estornos, CMV e custos fixos num resultado estimado por período.", icone: "📄" },
      { href: "/restaurante/financeiro/fluxo-caixa", titulo: "Fluxo de caixa", descricao: "Contas a pagar e a receber em aberto, projetadas mês a mês.", icone: "📅" },
      { href: "/restaurante/financeiro/estornos", titulo: "Estornos", descricao: "Histórico de todo estorno (manual ou Pix via Asaas), com motivo e valor.", icone: "↩" },
    ],
  },
  it: {
    titulo: "Finanza", subtitulo: "Debiti e crediti del ristorante. Per il flusso di cassa quotidiano, vedi la scheda Cassa.", abrir: "Apri modulo →",
    modulos: [
      { href: "/restaurante/financeiro/contas-a-receber", titulo: "Crediti", descricao: "Ordini venduti a credito, scadenza e sollecito via WhatsApp.", icone: "↙" },
      { href: "/restaurante/financeiro/contas-a-pagar", titulo: "Debiti", descricao: "Fornitori e altri conti con scadenza, per sapere cosa resta da pagare.", icone: "↗" },
      { href: "/restaurante/financeiro/dre", titulo: "Conto economico gestionale", descricao: "Ricavi, storni, costo del venduto e costi fissi in un risultato stimato per periodo.", icone: "📄" },
      { href: "/restaurante/financeiro/fluxo-caixa", titulo: "Flusso di cassa", descricao: "Debiti e crediti aperti, proiettati mese per mese.", icone: "📅" },
      { href: "/restaurante/financeiro/estornos", titulo: "Storni", descricao: "Storico di ogni storno (manuale o tramite provider di pagamento), con motivo e importo.", icone: "↩" },
    ],
  },
};

export default async function FinanceiroPage() {
  const { locale } = await requireRestaurantSubscription("financeiro");
  const t = CONTEUDO[locale];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.subtitulo}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {t.modulos.map((modulo) => (
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
                <span className="mt-3 inline-block text-xs font-medium text-amber-700">{t.abrir}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
