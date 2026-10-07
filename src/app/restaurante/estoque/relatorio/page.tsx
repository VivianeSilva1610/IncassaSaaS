import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { RelatorioEstoqueForm } from "@/components/delivery/RelatorioEstoqueForm";

export default async function EstoqueRelatorioPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("estoque");
  const { count } = await supabase
    .from("del_ingredients")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", restaurantOwnerId);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Relatório de estoque</h1>
      <p className="mt-1 text-sm text-stone-600">
        Quantidade final de cada um dos {count ?? 0} produtos ao fim de cada período, mais entradas, saídas e
        ajustes registrados nele. Escolha <strong>Mês</strong> pra ver um intervalo de meses (um fechamento por
        mês), ou <strong>Ano</strong> pra ver o fechamento de um ano específico.
      </p>

      <div className="mt-6">
        <RelatorioEstoqueForm />
      </div>

      <p className="mt-4 text-xs text-stone-500">
        Não é um snapshot salvo — é calculado na hora a partir do histórico de movimentos. O custo usado em cada
        período é o que estava vigente naquela data (registrado toda vez que você edita o custo de um produto).
        Para períodos anteriores ao início desse rastreamento, o custo aparece como &quot;desconhecido&quot;, em
        vez de usar o custo de hoje.
      </p>
    </div>
  );
}
