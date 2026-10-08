import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addIngredient, updateIngredient, deleteIngredient, addStockMovement } from "@/app/restaurante/actions";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; nomeIngrediente: string; unidade: string;
  quantidadeInicial: string; estoqueMinimo: string; custoUnitario: string; unidadeCompraOpcional: string;
  fatorConversao: string; ncmPlaceholder: string; ncmConferido: string; adicionar: string;
  buscarPlaceholder: string; buscar: string; limparBusca: string; minimo: string; comprado: string;
  origemXml: string; origemManual: string; revisar: string; editar: string; salvar: string; excluir: string;
  entrada: string; saida: string; ajuste: string; perda: string; quantidade: string; motivoOpcional: string;
  loteOpcional: string; validadeTitulo: string; registrarMovimento: string; nenhumEncontrado: (termo: string) => string;
  nenhumAinda: string;
}> = {
  "pt-BR": {
    voltar: "← Estoque", titulo: "Produtos",
    descricao: "Ingredientes e matérias-primas. Registre cada entrada ou saída para manter a quantidade atualizada.",
    nomeIngrediente: "Nome do ingrediente", unidade: "unidade", quantidadeInicial: "Quantidade inicial",
    estoqueMinimo: "Estoque mínimo (opcional)", custoUnitario: "Custo por unidade R$ (opcional)",
    unidadeCompraOpcional: "Unidade de compra (opcional, ex: saco, caixa)",
    fatorConversao: "Quantas unid. de estoque tem 1 unid. de compra (ex: 25)",
    ncmPlaceholder: "NCM com 8 dígitos (opcional)", ncmConferido: "NCM conferido", adicionar: "Adicionar ingrediente",
    buscarPlaceholder: "Buscar por nome, código ou NCM…", buscar: "Buscar", limparBusca: "Limpar busca",
    minimo: "mínimo", comprado: "comprado em", origemXml: "XML", origemManual: "manual", revisar: "revisar",
    editar: "Editar", salvar: "Salvar", excluir: "Excluir",
    entrada: "Entrada", saida: "Saída", ajuste: "Ajuste", perda: "Perda/desperdício",
    quantidade: "Quantidade", motivoOpcional: "Motivo (opcional)", loteOpcional: "Lote (só entrada, opcional)",
    validadeTitulo: "Validade (só entrada, opcional)", registrarMovimento: "Registrar movimento",
    nenhumEncontrado: (termo) => `Nenhum ingrediente encontrado para "${termo}".`, nenhumAinda: "Nenhum ingrediente ainda.",
  },
  it: {
    voltar: "← Magazzino", titulo: "Prodotti",
    descricao: "Ingredienti e materie prime. Registra ogni entrata o uscita per mantenere la quantità aggiornata.",
    nomeIngrediente: "Nome dell'ingrediente", unidade: "unità", quantidadeInicial: "Quantità iniziale",
    estoqueMinimo: "Scorta minima (opzionale)", custoUnitario: "Costo per unità EUR (opzionale)",
    unidadeCompraOpcional: "Unità di acquisto (opzionale, es: sacco, scatola)",
    fatorConversao: "Quante unità di magazzino per 1 unità di acquisto (es: 25)",
    ncmPlaceholder: "Classificazione (opzionale)", ncmConferido: "Verificato", adicionar: "Aggiungi ingrediente",
    buscarPlaceholder: "Cerca per nome o codice…", buscar: "Cerca", limparBusca: "Pulisci ricerca",
    minimo: "minimo", comprado: "acquistato in", origemXml: "XML", origemManual: "manuale", revisar: "da rivedere",
    editar: "Modifica", salvar: "Salva", excluir: "Elimina",
    entrada: "Entrata", saida: "Uscita", ajuste: "Rettifica", perda: "Perdita/spreco",
    quantidade: "Quantità", motivoOpcional: "Motivo (opzionale)", loteOpcional: "Lotto (solo entrata, opzionale)",
    validadeTitulo: "Scadenza (solo entrata, opzionale)", registrarMovimento: "Registra movimento",
    nenhumEncontrado: (termo) => `Nessun ingrediente trovato per "${termo}".`, nenhumAinda: "Nessun ingrediente ancora.",
  },
};

export default async function EstoqueProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { supabase, isGerente, locale } = await requireRestaurantSubscription("estoque");
  const t = CONTEUDO[locale];
  const moeda = locale === "it" ? "€" : "R$";
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
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <form action={addIngredient} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="nome" required placeholder={t.nomeIngrediente} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="unidade" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="kg">kg</option>
          <option value="l">l</option>
          <option value="un">{t.unidade}</option>
        </select>
        <input
          name="quantidade_atual"
          type="number"
          step="0.001"
          min="0"
          placeholder={t.quantidadeInicial}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="estoque_minimo"
          type="number"
          step="0.001"
          min="0"
          placeholder={t.estoqueMinimo}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="custo_unitario"
          type="number"
          step="0.01"
          min="0"
          placeholder={t.custoUnitario}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input name="unidade_compra" placeholder={t.unidadeCompraOpcional} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input
          name="fator_conversao_compra"
          type="number"
          step="0.0001"
          min="0"
          placeholder={t.fatorConversao}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        {locale !== "it" && (
          <>
            <input name="ncm" inputMode="numeric" maxLength={8} placeholder={t.ncmPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-stone-600"><input name="ncm_revisado" type="checkbox" /> {t.ncmConferido}</label>
          </>
        )}
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          {t.adicionar}
        </button>
      </form>

      <form method="get" className="mt-6 flex flex-wrap items-center gap-2">
        <input
          name="busca"
          defaultValue={termo}
          placeholder={t.buscarPlaceholder}
          className="min-w-56 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
          {t.buscar}
        </button>
        {termo && (
          <a href="/restaurante/estoque/produtos" className="text-xs text-stone-500 hover:underline">
            {t.limparBusca}
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
                    {i.estoque_minimo != null && ` · ${t.minimo} ${Number(i.estoque_minimo)} ${i.unidade}`}
                    {i.custo_unitario != null && ` · ${moeda}${Number(i.custo_unitario).toFixed(2)}/${i.unidade}`}
                    {i.unidade_compra && ` · ${t.comprado} ${i.unidade_compra} (1 ${i.unidade_compra} = ${Number(i.fator_conversao_compra)} ${i.unidade})`}
                  </p>
                  {locale !== "it" && i.ncm && <p className="mt-1 text-xs text-stone-500">NCM {i.ncm} · origem {i.ncm_origem === "xml" ? t.origemXml : t.origemManual}{!i.ncm_revisado && ` · ${t.revisar}`}</p>}
                </div>
                {isGerente && (
                  <div className="flex shrink-0 items-center gap-3">
                    <details className="relative">
                      <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">{t.editar}</summary>
                      <form
                        action={updateIngredient.bind(null, i.id)}
                        className="absolute right-0 z-10 mt-2 grid w-60 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                      >
                        <input name="nome" required defaultValue={i.nome} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <select name="unidade" defaultValue={i.unidade} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">
                          <option value="kg">kg</option>
                          <option value="l">l</option>
                          <option value="un">{t.unidade}</option>
                        </select>
                        <input
                          name="estoque_minimo"
                          type="number"
                          step="0.001"
                          min="0"
                          defaultValue={i.estoque_minimo ?? ""}
                          placeholder={t.estoqueMinimo}
                          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                        />
                        <input
                          name="custo_unitario"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={i.custo_unitario ?? ""}
                          placeholder={t.custoUnitario}
                          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                        />
                        <input name="unidade_compra" defaultValue={i.unidade_compra ?? ""} placeholder={t.unidadeCompraOpcional} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <input
                          name="fator_conversao_compra"
                          type="number"
                          step="0.0001"
                          min="0"
                          defaultValue={i.fator_conversao_compra ?? ""}
                          placeholder={t.fatorConversao}
                          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                        />
                        {locale !== "it" && (
                          <>
                            <input name="ncm" inputMode="numeric" maxLength={8} defaultValue={i.ncm ?? ""} placeholder={t.ncmPlaceholder} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                            <label className="flex items-center gap-2 text-xs text-stone-600"><input name="ncm_revisado" type="checkbox" defaultChecked={Boolean(i.ncm_revisado)} /> {t.ncmConferido}</label>
                          </>
                        )}
                        <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                          {t.salvar}
                        </button>
                      </form>
                    </details>
                    <form action={deleteIngredient.bind(null, i.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        {t.excluir}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <form action={addStockMovement} className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
                <input type="hidden" name="ingredient_id" value={i.id} />
                <select name="tipo" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                  <option value="entrada">{t.entrada}</option>
                  <option value="saida">{t.saida}</option>
                  <option value="ajuste">{t.ajuste}</option>
                  <option value="perda">{t.perda}</option>
                </select>
                <input
                  name="quantidade"
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  placeholder={t.quantidade}
                  className="w-24 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="motivo"
                  placeholder={t.motivoOpcional}
                  className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="numero_lote"
                  placeholder={t.loteOpcional}
                  className="w-32 rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <input
                  name="validade"
                  type="date"
                  title={t.validadeTitulo}
                  className="rounded-md border border-stone-300 px-2 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200"
                >
                  {t.registrarMovimento}
                </button>
              </form>
            </div>
          );
        })}
        {(ingredientesFiltrados ?? []).length === 0 && (
          <p className="text-sm text-stone-500">
            {termo ? t.nenhumEncontrado(termo) : t.nenhumAinda}
          </p>
        )}
      </div>
    </div>
  );
}
