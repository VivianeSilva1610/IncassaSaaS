import Link from "next/link";
import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { registrarCompraFornecedor } from "@/app/restaurante/actions";

const CONTEUDO: Record<RestauranteLocale, {
  voltar: string; titulo: string; descricao: string; produtoNovo: string; emEstoque: string; compraEm: string;
  nomePlaceholder: string; unidade: string; unidadeEstoque: string; unidadeCompra: string; quantidadeComprada: string;
  custoUnitario: string; fornecedorOpcional: string; loteOpcional: string; validadeOpcional: string;
  registrar: string; nfeDica: (link: React.ReactNode) => React.ReactNode;
}> = {
  "pt-BR": {
    voltar: "← Compras", titulo: "Compra de fornecedor",
    descricao: "Escolha o produto já cadastrado para só somar ao estoque, ou deixe em \"Produto novo\" para cadastrar com um código novo automaticamente. Se o produto tiver uma unidade de compra cadastrada (ex: saco, caixa), você pode informar a quantidade/custo nela em vez de calcular a conversão de cabeça.",
    produtoNovo: "➕ Produto novo (gera código automático)", emEstoque: "em estoque", compraEm: "compra em",
    nomePlaceholder: "Nome (só se for produto novo)", unidade: "unidade",
    unidadeEstoque: "Quantidade/custo informados na unidade de estoque (kg/l/un)",
    unidadeCompra: "Quantidade/custo informados na unidade de compra (ex: sacos) — produto precisa já ter essa conversão cadastrada",
    quantidadeComprada: "Quantidade comprada", custoUnitario: "Custo por unidade informada R$ (opcional)",
    fornecedorOpcional: "Fornecedor (opcional)", loteOpcional: "Lote (opcional)", validadeOpcional: "Validade (opcional)",
    registrar: "Registrar compra",
    nfeDica: (link) => <>Pra importar uma NF-e real de fornecedor (XML), use {link}.</>,
  },
  it: {
    voltar: "← Acquisti", titulo: "Acquisto da fornitore",
    descricao: "Scegli il prodotto già registrato per sommarlo solo al magazzino, oppure lascia su \"Nuovo prodotto\" per registrarlo con un codice nuovo automatico. Se il prodotto ha un'unità di acquisto registrata (es: sacco, scatola), puoi indicare la quantità/costo in quell'unità invece di calcolare la conversione a mano.",
    produtoNovo: "➕ Nuovo prodotto (genera codice automatico)", emEstoque: "in magazzino", compraEm: "acquisto in",
    nomePlaceholder: "Nome (solo se è un prodotto nuovo)", unidade: "unità",
    unidadeEstoque: "Quantità/costo indicati nell'unità di magazzino (kg/l/pz)",
    unidadeCompra: "Quantità/costo indicati nell'unità di acquisto (es: sacchi) — il prodotto deve già avere questa conversione registrata",
    quantidadeComprada: "Quantità acquistata", custoUnitario: "Costo per unità indicata EUR (opzionale)",
    fornecedorOpcional: "Fornitore (opzionale)", loteOpcional: "Lotto (opzionale)", validadeOpcional: "Scadenza (opzionale)",
    registrar: "Registra acquisto",
    nfeDica: (link) => <>Per importare una fattura elettronica di acquisto, usa {link}.</>,
  },
};

export default async function EstoqueComprasPage() {
  const { supabase, locale } = await requireRestaurantSubscription("compras");
  const t = CONTEUDO[locale];
  const { data: todosIngredientes } = await supabase.from("del_ingredients").select("*").order("nome");

  return (
    <div>
      <Link href="/restaurante/compras" className="text-sm text-amber-700 underline underline-offset-2">
        {t.voltar}
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

      <form action={registrarCompraFornecedor} className="mt-6 grid gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-2">
        <select name="ingredient_id" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2">
          <option value="">{t.produtoNovo}</option>
          {(todosIngredientes ?? []).map((i) => (
            <option key={i.id} value={i.id}>
              {i.codigo} — {i.nome} ({Number(i.quantidade_atual)} {i.unidade} {t.emEstoque}
              {i.unidade_compra ? `, ${t.compraEm} ${i.unidade_compra} = ${Number(i.fator_conversao_compra)} ${i.unidade}` : ""})
            </option>
          ))}
        </select>
        <input name="nome" placeholder={t.nomePlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="unidade" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="kg">kg</option>
          <option value="l">l</option>
          <option value="un">{t.unidade}</option>
        </select>
        <select name="unidade_informada" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2">
          <option value="estoque">{t.unidadeEstoque}</option>
          <option value="compra">{t.unidadeCompra}</option>
        </select>
        <input
          name="quantidade"
          type="number"
          step="0.001"
          min="0"
          required
          placeholder={t.quantidadeComprada}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="custo_unitario"
          type="number"
          step="0.01"
          min="0"
          placeholder={t.custoUnitario}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <input
          name="fornecedor"
          placeholder={t.fornecedorOpcional}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <input name="numero_lote" placeholder={t.loteOpcional} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.validadeOpcional}</span>
          <input name="validade" type="date" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button
          type="submit"
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-amber-700 active:scale-[0.98] sm:col-span-2"
        >
          {t.registrar}
        </button>
      </form>

      {locale !== "it" && (
        <p className="mt-4 text-xs text-stone-500">
          {t.nfeDica(
            <Link href="/restaurante/compras/nfe" className="text-amber-700 underline underline-offset-2">
              Compras e fornecedores
            </Link>,
          )}
        </p>
      )}
    </div>
  );
}
