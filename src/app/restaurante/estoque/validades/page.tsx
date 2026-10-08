import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { excluirLote } from "@/app/restaurante/actions";

function formatData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

function diasAteVencer(validade: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(`${validade}T00:00:00`);
  return Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function EstoqueValidadesPage() {
  const { supabase } = await requireRestaurantSubscription("estoque");

  const { data: lotes } = await supabase
    .from("del_lotes_estoque")
    .select("id, numero_lote, quantidade, validade, origem, created_at, del_ingredients(nome, unidade)")
    .not("validade", "is", null)
    .order("validade", { ascending: true });

  const { data: semValidade } = await supabase
    .from("del_lotes_estoque")
    .select("id, numero_lote, quantidade, created_at, del_ingredients(nome, unidade)")
    .is("validade", null)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Lotes e validade</h1>
      <p className="mt-1 text-sm text-stone-600">
        Registro de lote/validade por entrada de estoque — não controla saldo por lote (o estoque continua somado
        por ingrediente), só alerta antes de vencer. Informe lote/validade ao registrar uma entrada em Produtos,
        Compra de fornecedor ou ao confirmar uma NF-e.
      </p>

      <div className="mt-4 space-y-2">
        {(lotes ?? []).map((l) => {
          const ingrediente = Array.isArray(l.del_ingredients) ? l.del_ingredients[0] : l.del_ingredients;
          const dias = diasAteVencer(l.validade as string);
          const classe = dias < 0 ? "border-red-300 bg-red-50" : dias <= 7 ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white";
          const badge =
            dias < 0 ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Vencido há {Math.abs(dias)} dia{Math.abs(dias) === 1 ? "" : "s"}</span>
            ) : dias <= 7 ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Vence em {dias} dia{dias === 1 ? "" : "s"}</span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">OK</span>
            );
          return (
            <div key={l.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${classe}`}>
              <div>
                <span className="font-medium text-stone-900">{ingrediente?.nome ?? "?"}</span>
                <span className="text-stone-500"> — {Number(l.quantidade)} {ingrediente?.unidade}</span>
                {l.numero_lote && <span className="text-stone-500"> · lote {l.numero_lote}</span>}
                <span className="text-stone-500"> · validade {formatData(l.validade as string)}</span>
              </div>
              <div className="flex items-center gap-3">
                {badge}
                <form action={excluirLote.bind(null, l.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
                </form>
              </div>
            </div>
          );
        })}
        {(lotes ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum lote com validade registrado ainda.</p>}
      </div>

      {(semValidade ?? []).length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-stone-900">Entradas sem validade registrada (últimas 20)</h2>
          <div className="mt-2 space-y-1.5">
            {(semValidade ?? []).map((l) => {
              const ingrediente = Array.isArray(l.del_ingredients) ? l.del_ingredients[0] : l.del_ingredients;
              return (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                  <span>
                    {ingrediente?.nome ?? "?"} — {Number(l.quantidade)} {ingrediente?.unidade}
                    {l.numero_lote && ` · lote ${l.numero_lote}`}
                  </span>
                  <form action={excluirLote.bind(null, l.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Excluir</button>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
