import Link from "next/link";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { addIngredient, updateIngredient, deleteIngredient, addStockMovement } from "@/app/restaurante/actions";

export default async function EstoqueProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { supabase, isGerente } = await requireRestaurantSubscription("estoque");
  const { busca } = await searchParams;
  const termo = (busca ?? "").trim();
  const termoSeguro = termo.replace(/[,%()]/g, " ").trim();
  const termoNcm = termo.replace(/\D/g, "");
  const filtros = [`nome.ilike.%${termoSeguro}%`, `codigo.ilike.%${termoSeguro}%`];
  if (termoNcm) filtros.push(`ncm.ilike.%${termoNcm}%`);

  const { data: ingredientesFiltrados } = termo
    ? await supabase
        .from("del_ingredients")
        .select("*")
        .or(filtros.join(","))
        .order("nome")
    : await supabase.from("del_ingredients").select("*").order("nome");

  return (
    <div>
      <Link href="/restaurante/estoque" className="text-sm text-amber-700 underline underline-offset-2">
        ← Estoque
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">Produtos</h1>
      <p className="mt-1 text-sm text-stone-600">
        Ingredientes e matérias-primas. Registre cada entrada ou saída para manter a quantidade atualizada.
      </p>

      <form action={addIngredient} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder="Nome do ingrediente" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="unidade" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="kg">kg</option>
          <option value="l">l</option>
          <option value="un">unidade</option>
        </select>
        <input
          name="quantidade_atual"
          type="number"
          step="0.001"
          min="0"
          placeholder="Quantidade inicial"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="estoque_minimo"
          type="number"
          step="0.001"
          min="0"
          placeholder="Estoque mínimo (opcional)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="custo_unitario"
          type="number"
          step="0.01"
          min="0"
          placeholder="Custo por unidade R$ (opcional)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input name="unidade_compra" placeholder="Unidade de compra (opcional, ex: saco, caixa)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input
          name="fator_conversao_compra"
          type="number"
          step="0.0001"
          min="0"
          placeholder="Quantas unid. de estoque tem 1 unid. de compra (ex: 25)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input name="ncm" inputMode="numeric" maxLength={8} placeholder="NCM com 8 dígitos (opcional)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-stone-600"><input name="ncm_revisado" type="checkbox" /> NCM conferido</label>
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Adicionar ingrediente
        </button>
      </form>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <input
          name="busca"
          defaultValue={termo}
          placeholder="Buscar por nome, código ou NCM…"
          className="min-w-56 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          Buscar
        </button>
        {termo && (
          <a href="/restaurante/estoque/produtos" className="text-xs text-stone-500 hover:underline">
            Limpar busca
          </a>
        )}
      </form>

      <div className="mt-3 space-y-2">
        {(ingredientesFiltrados ?? []).map((i) => {
          const emFalta = i.estoque_minimo != null && Number(i.quantidade_atual) <= Number(i.estoque_minimo);
          return (
            <div key={i.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900">
                    {emFalta && "⚠️ "}
                    <span className="text-stone-400">{i.codigo}</span> {i.nome}
                  </p>
                  <p className="text-sm text-stone-500">
                    {Number(i.quantidade_atual)} {i.unidade}
                    {i.estoque_minimo != null && ` · mínimo ${Number(i.estoque_minimo)} ${i.unidade}`}
                    {i.custo_unitario != null && ` · R$${Number(i.custo_unitario).toFixed(2)}/${i.unidade}`}
                    {i.unidade_compra && ` · comprado em ${i.unidade_compra} (1 ${i.unidade_compra} = ${Number(i.fator_conversao_compra)} ${i.unidade})`}
                  </p>
                  {i.ncm && <p className="mt-1 text-xs text-stone-500">NCM {i.ncm} · origem {i.ncm_origem === "xml" ? "XML" : "manual"}{!i.ncm_revisado && " · revisar"}</p>}
                </div>
                {isGerente && (
                  <div className="flex shrink-0 items-center gap-3">
                    <details className="relative">
                      <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">Editar</summary>
                      <form
                        action={updateIngredient.bind(null, i.id)}
                        className="absolute right-0 z-10 mt-2 grid w-60 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                      >
                        <input name="nome" required defaultValue={i.nome} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <select name="unidade" defaultValue={i.unidade} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">
                          <option value="kg">kg</option>
                          <option value="l">l</option>
                          <option value="un">unidade</option>
                        </select>
                        <input
                          name="estoque_minimo"
                          type="number"
                          step="0.001"
                          min="0"
                          defaultValue={i.estoque_minimo ?? ""}
                          placeholder="Estoque mínimo"
                          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                        />
                        <input
                          name="custo_unitario"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={i.custo_unitario ?? ""}
                          placeholder="Custo por unidade (R$)"
                          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                        />
                        <input name="unidade_compra" defaultValue={i.unidade_compra ?? ""} placeholder="Unidade de compra (ex: saco)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <input
                          name="fator_conversao_compra"
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={i.fator_conversao_compra ?? ""}
                          placeholder="Quantas unid. de estoque por unid. de compra"
                          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                        />
                        <input name="ncm" inputMode="numeric" maxLength={8} defaultValue={i.ncm ?? ""} placeholder="NCM (opcional)" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <label className="flex items-center gap-2 text-xs text-stone-600"><input name="ncm_revisado" type="checkbox" defaultChecked={Boolean(i.ncm_revisado)} /> NCM conferido</label>
                        <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                          Salvar
                        </button>
                      </form>
                    </details>
                    <form action={deleteIngredient.bind(null, i.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Excluir
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <form action={addStockMovement} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                <input type="hidden" name="ingredient_id" value={i.id} />
                <select name="tipo" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="ajuste">Ajuste</option>
                  <option value="perda">Perda/desperdício</option>
                </select>
                <input
                  name="quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder="Quantidade"
                  className="w-24 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="motivo"
                  placeholder="Motivo (opcional)"
                  className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="numero_lote"
                  placeholder="Lote (só entrada, opcional)"
                  className="w-32 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="validade"
                  type="date"
                  title="Validade (só entrada, opcional)"
                  className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200"
                >
                  Registrar movimento
                </button>
              </form>
            </div>
          );
        })}
        {(ingredientesFiltrados ?? []).length === 0 && (
          <p className="text-sm text-stone-500">
            {termo ? `Nenhum ingrediente encontrado para "${termo}".` : "Nenhum ingrediente ainda."}
          </p>
        )}
      </div>
    </div>
  );
}
