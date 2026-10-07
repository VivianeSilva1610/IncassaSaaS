import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

export default async function EstoqueRelatorioPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
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
        Exporte todos os produtos cadastrados ({count ?? 0}), com quantidade, custo e valor total em estoque.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/api/restaurante/export-estoque?formato=csv"
          className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]"
        >
          Baixar CSV
        </a>
        <a
          href="/api/restaurante/export-estoque?formato=excel"
          className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-emerald-600 active:scale-[0.98]"
        >
          Baixar Excel (.xlsx)
        </a>
      </div>
    </div>
  );
}
