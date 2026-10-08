import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { realizarInventario } from "@/app/restaurante/actions";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; observacaoOpcional: string; produto: string;
  noSistema: string; contagemFisica: string; nenhumProduto: string; registrarContagem: string;
  inventariosAnteriores: string;
}> = {
  "pt-BR": {
    voltar: "← Estoque", titulo: "Inventário",
    descricao: "Conte o que tem fisicamente de cada produto. Deixe em branco o que não quer conferir agora — só os preenchidos entram na contagem. Diferença pra menos vira perda/desperdício; pra mais vira ajuste.",
    observacaoOpcional: "Observação (opcional)", produto: "Produto", noSistema: "No sistema",
    contagemFisica: "Contagem física", nenhumProduto: "Nenhum produto cadastrado ainda.",
    registrarContagem: "Registrar contagem", inventariosAnteriores: "Inventários anteriores",
  },
  it: {
    voltar: "← Magazzino", titulo: "Inventario",
    descricao: "Conta cosa hai fisicamente di ogni prodotto. Lascia vuoto quello che non vuoi verificare ora — solo i compilati entrano nel conteggio. La differenza in meno diventa perdita/spreco; in più diventa rettifica.",
    observacaoOpcional: "Nota (opzionale)", produto: "Prodotto", noSistema: "A sistema",
    contagemFisica: "Conteggio fisico", nenhumProduto: "Nessun prodotto registrato ancora.",
    registrarContagem: "Registra conteggio", inventariosAnteriores: "Inventari precedenti",
  },
};

export default async function InventarioPage() {
  const { supabase, restaurantOwnerId, locale } = await requireRestaurantSubscription("estoque");
  const t = CONTEUDO[locale];
  const intlLocale = locale === "it" ? "it-IT" : "pt-BR";
  const timezone = locale === "it" ? "Europe/Rome" : "America/Sao_Paulo";

  const [{ data: ingredientes }, { data: inventariosAnteriores }] = await Promise.all([
    supabase.from("del_ingredients").select("id, codigo, nome, unidade, quantidade_atual").eq("owner_id", restaurantOwnerId).order("nome"),
    supabase.from("del_inventarios").select("id, created_at, realizado_por_email, observacao").eq("owner_id", restaurantOwnerId).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <form action={realizarInventario} className="mt-6">
        <input name="observacao" placeholder={t.observacaoOpcional} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                <th className="py-2 pr-3">{t.produto}</th>
                <th className="py-2 pr-3">{t.noSistema}</th>
                <th className="py-2 pr-3">{t.contagemFisica}</th>
              </tr>
            </thead>
            <tbody>
              {(ingredientes ?? []).map((i) => (
                <tr key={i.id} className="border-b border-stone-100">
                  <td className="py-2 pr-3">
                    <span className="text-stone-400">{i.codigo}</span> {i.nome}
                  </td>
                  <td className="py-2 pr-3 text-stone-600">
                    {Number(i.quantidade_atual)} {i.unidade}
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      name={`contagem_${i.id}`}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="—"
                      className="w-28 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              ))}
              {(ingredientes ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-stone-500">
                    {t.nenhumProduto}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button type="submit" className="mt-4 rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
          {t.registrarContagem}
        </button>
      </form>

      {(inventariosAnteriores ?? []).length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-stone-900">{t.inventariosAnteriores}</h2>
          <div className="mt-2 space-y-2">
            {(inventariosAnteriores ?? []).map((inv) => (
              <Link
                key={inv.id}
                href={`/restaurante/estoque/inventario/${inv.id}`}
                className="block rounded-lg border border-stone-200 bg-white p-3 text-sm hover:border-amber-300"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900">{new Date(inv.created_at).toLocaleString(intlLocale, { timeZone: timezone })}</span>
                  <span className="text-xs text-stone-400">{inv.realizado_por_email}</span>
                </div>
                {inv.observacao && <p className="mt-0.5 text-xs text-stone-500">{inv.observacao}</p>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
