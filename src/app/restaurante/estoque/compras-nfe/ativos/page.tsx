import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function AtivosPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { data: ativos } = await supabase
    .from("del_ativos")
    .select("id, nome, valor_aquisicao, adquirido_em, status, nota_entrada_item_id")
    .eq("owner_id", restaurantOwnerId)
    .order("adquirido_em", { ascending: false });

  const totalAtivo = (ativos ?? [])
    .filter((ativo) => ativo.status === "ativo")
    .reduce((total, ativo) => total + Number(ativo.valor_aquisicao), 0);

  return (
    <div>
      <Link href="/restaurante/estoque/compras-nfe" className="text-sm text-amber-700 hover:underline">← Voltar para compras</Link>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">Ativos imobilizados</h1>
      <p className="mt-1 text-sm text-stone-600">
        Equipamentos classificados durante a conferência das compras. A classificação e a depreciação devem ser validadas pelo contador.
      </p>

      <div className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm text-stone-500">Valor de aquisição dos ativos em uso</p>
        <p className="mt-1 text-2xl font-bold text-stone-900">{money(totalAtivo)}</p>
      </div>

      <div className="mt-6 space-y-3">
        {(ativos ?? []).map((ativo) => (
          <div key={ativo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <div>
              <p className="font-medium text-stone-900">{ativo.nome}</p>
              <p className="text-sm text-stone-500">Adquirido em {new Date(`${ativo.adquirido_em}T12:00:00`).toLocaleDateString("pt-BR")} · {ativo.status}</p>
            </div>
            <p className="font-semibold text-stone-900">{money(Number(ativo.valor_aquisicao))}</p>
          </div>
        ))}
        {(ativos ?? []).length === 0 && <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">Nenhum ativo classificado até o momento.</p>}
      </div>
    </div>
  );
}
