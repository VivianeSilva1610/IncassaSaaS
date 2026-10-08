import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addFixedCost, deleteFixedCost } from "@/app/restaurante/actions";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; descricaoPlaceholder: string; valorPlaceholder: string;
  adicionar: string; excluir: string; nenhumCusto: string; total: (valor: string) => string;
}> = {
  "pt-BR": {
    voltar: "← Custos", titulo: "Custos fixos mensais", descricao: "Aluguel, contas, internet, MEI, etc. — some tudo por mês.",
    descricaoPlaceholder: "Descrição (ex: Aluguel)", valorPlaceholder: "Valor mensal (R$)",
    adicionar: "Adicionar custo fixo", excluir: "Excluir", nenhumCusto: "Nenhum custo fixo cadastrado ainda.",
    total: (valor) => `Total de custos fixos por mês: ${valor}`,
  },
  it: {
    voltar: "← Costi", titulo: "Costi fissi mensili", descricao: "Affitto, bollette, internet, licenze, ecc. — somma tutto al mese.",
    descricaoPlaceholder: "Descrizione (es: Affitto)", valorPlaceholder: "Importo mensile (EUR)",
    adicionar: "Aggiungi costo fisso", excluir: "Elimina", nenhumCusto: "Nessun costo fisso registrato ancora.",
    total: (valor) => `Totale costi fissi al mese: ${valor}`,
  },
};

export default async function CustosFixosPage() {
  const { supabase, locale } = await requireRestaurantSubscription("custos");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));

  const { data: fixedCosts } = await supabase.from("del_fixed_costs").select("*").order("created_at");
  const totalCustosFixos = (fixedCosts ?? []).reduce((sum, c) => sum + Number(c.valor_mensal), 0);

  return (
    <div>
      <Link href="/restaurante/custos" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

      <form action={addFixedCost} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="descricao" required placeholder={t.descricaoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="valor_mensal" type="number" step="0.01" min="0" required placeholder={t.valorPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2">
          {t.adicionar}
        </button>
      </form>

      <div className="mt-3 space-y-1.5">
        {(fixedCosts ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
            <span>{c.descricao} — {formatReal(Number(c.valor_mensal))}</span>
            <form action={deleteFixedCost.bind(null, c.id)}>
              <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
            </form>
          </div>
        ))}
        {(fixedCosts ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumCusto}</p>}
      </div>
      <p className="mt-2 text-sm font-medium text-stone-900">{t.total(formatReal(totalCustosFixos))}</p>
    </div>
  );
}
