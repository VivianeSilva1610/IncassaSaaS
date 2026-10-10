import { updateProductFiscal } from "@/app/restaurante/actions";
import { requireRestaurantSubscription } from "@/lib/subscription";

export default async function ClassificacaoFiscalPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription("fiscal");
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("country_code")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();

  if (restaurant?.country_code === "IT") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Classificazione fiscale</h1>
        <p className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          NCM, CFOP e CEST sono classificazioni fiscali brasiliane e non si applicano a questo
          ristorante. Quest&apos;area non ha ancora un equivalente per l&apos;Italia.
        </p>
      </div>
    );
  }

  const [{ data: products }, { data: fiscalConfig }] = await Promise.all([
    supabase
      .from("del_products")
      .select("id, nome, categoria, ncm, cfop, cest, origem, cst, csosn, aliquota_icms")
      .eq("owner_id", restaurantOwnerId)
      .order("nome"),
    supabase.from("del_fiscal_config").select("regime_tributario").eq("owner_id", restaurantOwnerId).maybeSingle(),
  ]);
  const regime = fiscalConfig?.regime_tributario ?? "mei";

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Classificação fiscal</h1>
      <p className="mt-1 text-sm text-stone-600">Revise NCM, CFOP, CEST e origem de cada produto com o contador.</p>

      {regime === "mei" && (
        <p className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          Regime MEI: CST, CSOSN e alíquota de ICMS não se aplicam normalmente ao seu enquadramento — esses campos
          ficam ocultos. Se isso mudar, atualize o regime tributário em Dados do estabelecimento.
        </p>
      )}

      <div className="mt-6 space-y-2">
        {(products ?? []).map((p) => (
          <details key={p.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
            <summary className="cursor-pointer list-none font-medium text-stone-900">
              {p.nome} <span className="font-normal text-stone-400">— NCM {p.ncm || "—"} · CFOP {p.cfop} · origem {p.origem}</span>
            </summary>
            <form action={updateProductFiscal.bind(null, p.id)} className="mt-3 grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-4">
              <input name="ncm" defaultValue={p.ncm ?? ""} placeholder="NCM (8 dígitos)" className="rounded-md border border-stone-300 px-2 py-2 text-xs" />
              <input name="cfop" defaultValue={p.cfop ?? "5102"} placeholder="CFOP (4 dígitos)" className="rounded-md border border-stone-300 px-2 py-2 text-xs" />
              <input name="cest" defaultValue={p.cest ?? ""} placeholder="CEST (7 dígitos, opcional)" className="rounded-md border border-stone-300 px-2 py-2 text-xs" />
              <select name="origem" defaultValue={p.origem ?? 0} className="rounded-md border border-stone-300 px-2 py-2 text-xs">
                <option value="0">0 — Nacional</option>
                <option value="1">1 — Estrangeira, importação direta</option>
                <option value="2">2 — Estrangeira, mercado interno</option>
              </select>
              {regime === "normal" && (
                <input name="cst" defaultValue={p.cst ?? ""} inputMode="numeric" maxLength={2} placeholder="CST ICMS (2 dígitos, confirmar c/ contador)" className="rounded-md border border-stone-300 px-2 py-2 text-xs sm:col-span-2" />
              )}
              {regime === "simples_nacional" && (
                <input name="csosn" defaultValue={p.csosn ?? ""} inputMode="numeric" maxLength={3} placeholder="CSOSN (3 dígitos, confirmar c/ contador)" className="rounded-md border border-stone-300 px-2 py-2 text-xs sm:col-span-2" />
              )}
              {regime !== "mei" && (
                <input name="aliquota_icms" defaultValue={p.aliquota_icms ?? ""} inputMode="decimal" placeholder="Alíquota ICMS % (confirmar c/ contador)" className="rounded-md border border-stone-300 px-2 py-2 text-xs sm:col-span-2" />
              )}
              <button type="submit" className="rounded-md bg-stone-900 px-3 py-2 text-xs font-medium text-white sm:col-span-4">Salvar classificação</button>
            </form>
          </details>
        ))}
        {(products ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum produto cadastrado.</p>}
      </div>
    </div>
  );
}
