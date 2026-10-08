import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; contagemDe: string; por: string; contagemRegistrada: string;
  nenhumaDiferenca: string; produtosComDiferenca: (n: string) => string; diferencasEncontradas: string;
  perda: string; ajuste: string; sistemaContado: (sistema: number, contado: number) => string;
  nenhumaDiferencaContagem: string;
}> = {
  "pt-BR": {
    voltar: "← Inventário", contagemDe: "Contagem de", por: "Por", contagemRegistrada: "Contagem registrada.",
    nenhumaDiferenca: "Nenhuma diferença encontrada.",
    produtosComDiferenca: (n) => `${n} produto(s) com diferença — estoque já ajustado.`,
    diferencasEncontradas: "Diferenças encontradas", perda: "(perda)", ajuste: "(ajuste)",
    sistemaContado: (sistema, contado) => `Sistema: ${sistema} · Contado: ${contado}`,
    nenhumaDiferencaContagem: "Nenhuma diferença nesta contagem.",
  },
  it: {
    voltar: "← Inventario", contagemDe: "Conteggio del", por: "Di", contagemRegistrada: "Conteggio registrato.",
    nenhumaDiferenca: "Nessuna differenza trovata.",
    produtosComDiferenca: (n) => `${n} prodotto/i con differenza — magazzino già rettificato.`,
    diferencasEncontradas: "Differenze trovate", perda: "(perdita)", ajuste: "(rettifica)",
    sistemaContado: (sistema, contado) => `Sistema: ${sistema} · Contato: ${contado}`,
    nenhumaDiferencaContagem: "Nessuna differenza in questo conteggio.",
  },
};

export default async function InventarioDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ itens?: string }>;
}) {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("estoque");
  const t = CONTEUDO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";
  const { id } = await params;
  const { itens } = await searchParams;

  const { data: inventario } = await supabase
    .from("del_inventarios")
    .select("id, created_at, realizado_por_email, observacao")
    .eq("owner_id", restaurantOwnerId)
    .eq("id", id)
    .maybeSingle();
  if (!inventario) notFound();

  const { data: itensInventario } = await supabase
    .from("del_inventario_itens")
    .select("quantidade_sistema, quantidade_contada, diferenca, del_ingredients(codigo, nome, unidade)")
    .eq("inventario_id", id)
    .order("diferenca");

  const comDiferenca = (itensInventario ?? []).filter((i) => Math.abs(Number(i.diferenca)) > 0.0001);

  return (
    <div>
      <Link href="/restaurante/estoque/inventario" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.contagemDe} {new Date(inventario.created_at).toLocaleString(intlLocale, { timeZone: timezone })}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.por} {inventario.realizado_por_email}
        {inventario.observacao && ` · ${inventario.observacao}`}
      </p>

      {itens && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {t.contagemRegistrada} {itens === "0" ? t.nenhumaDiferenca : t.produtosComDiferenca(itens)}
        </p>
      )}

      <div className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.diferencasEncontradas}</h2>
        <div className="mt-2 space-y-2">
          {comDiferenca.map((item, idx) => {
            const ingrediente = Array.isArray(item.del_ingredients) ? item.del_ingredients[0] : item.del_ingredients;
            const diferenca = Number(item.diferenca);
            return (
              <div key={idx} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">
                    <span className="text-stone-400">{ingrediente?.codigo}</span> {ingrediente?.nome}
                  </span>
                  <span className={diferenca < 0 ? "text-red-600" : "text-emerald-700"}>
                    {diferenca > 0 ? "+" : ""}
                    {diferenca} {ingrediente?.unidade}
                    {" "}{diferenca < 0 ? t.perda : t.ajuste}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {t.sistemaContado(Number(item.quantidade_sistema), Number(item.quantidade_contada))}
                </p>
              </div>
            );
          })}
          {comDiferenca.length === 0 && <p className="text-sm text-stone-500">{t.nenhumaDiferencaContagem}</p>}
        </div>
      </div>
    </div>
  );
}
