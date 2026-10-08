import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { RelatorioEstoqueForm } from "@/components/delivery/RelatorioEstoqueForm";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string;
  descricao: (count: number) => React.ReactNode;
  rodape: string;
}> = {
  "pt-BR": {
    voltar: "← Estoque", titulo: "Relatório de estoque",
    descricao: (count) => <>Quantidade final de cada um dos {count} produtos ao fim de cada período, mais entradas, saídas e ajustes registrados nele. Escolha <strong>Mês</strong> pra ver um intervalo de meses (um fechamento por mês), ou <strong>Ano</strong> pra ver o fechamento de um ano específico.</>,
    rodape: "Não é um snapshot salvo — é calculado na hora a partir do histórico de movimentos. O custo usado em cada período é o que estava vigente naquela data (registrado toda vez que você edita o custo de um produto). Para períodos anteriores ao início desse rastreamento, o custo aparece como \"desconhecido\", em vez de usar o custo de hoje.",
  },
  it: {
    voltar: "← Magazzino", titulo: "Report di magazzino",
    descricao: (count) => <>Quantità finale di ciascuno dei {count} prodotti alla fine di ogni periodo, più entrate, uscite e rettifiche registrate in esso. Scegli <strong>Mese</strong> per vedere un intervallo di mesi (una chiusura per mese), o <strong>Anno</strong> per vedere la chiusura di un anno specifico.</>,
    rodape: "Non è uno snapshot salvato — viene calcolato al momento a partire dallo storico dei movimenti. Il costo usato in ogni periodo è quello vigente in quella data (registrato ogni volta che modifichi il costo di un prodotto). Per periodi precedenti all'inizio di questo tracciamento, il costo appare come \"sconosciuto\", invece di usare il costo di oggi.",
  },
};

export default async function EstoqueRelatorioPage() {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("estoque");
  const t = CONTEUDO[locale];
  const { count } = await supabase
    .from("del_ingredients")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", restaurantOwnerId);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao(count ?? 0)}
      </p>

      <div className="mt-6">
        <RelatorioEstoqueForm locale={locale} />
      </div>

      <p className="mt-4 text-xs text-stone-500">
        {t.rodape}
      </p>
    </div>
  );
}
