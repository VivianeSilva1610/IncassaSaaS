import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addProduct, deleteProduct, addCardapioDia, removeCardapioDia, updateNomeMenu } from "@/app/restaurante/actions";

function formatMoney(value: number, locale: RestauranteLocale) {
  return locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const DIAS_SEMANA: Record<RestauranteLocale, string[]> = {
  "pt-BR": ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  it: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
};

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; nomeMenu: string; nomeMenuDescricao: string; nomeMenuPlaceholder: string;
  salvarNome: string; tamanhos: string; tamanhosDica: string; nomeTamanhoPlaceholder: string; precoPlaceholder: string;
  qtdAcompanhamentos: string; adicionarTamanho: string; acompanhamentosLabel: string; nenhumTamanho: string;
  pratosPrincipais: string; nomePrincipalPlaceholder: string; adicionarPrincipal: string; nenhumPrincipal: string;
  acompanhamentos: string; nomeAcompanhamentoPlaceholder: string; adicionarAcompanhamento: string; nenhumAcompanhamento: string;
  extras: string; nomeExtraPlaceholder: string; adicionarExtra: string; nenhumExtra: string; excluir: string;
  cardapioSemana: string; cardapioSemanaDica: string; nenhumPrincipalDefinido: string; principalPlaceholder: string;
  adicionarAoDia: string; remover: string;
}> = {
  "pt-BR": {
    titulo: "Cardápio — Monte seu Pranzo",
    descricao: "Defina os tamanhos de marmitex, os pratos principais, acompanhamentos e extras. Depois monte a agenda da semana dizendo quais principais estão disponíveis em cada dia.",
    nomeMenu: "Nome do menu", nomeMenuDescricao: "O nome que aparece no site pro cliente — pode ser diferente do nome oficial do seu negócio.",
    nomeMenuPlaceholder: "Ex: Menu della Nonna", salvarNome: "Salvar nome",
    tamanhos: "Tamanhos de marmitex", tamanhosDica: "Ex: Marmitex M — R$18,00 — 3 acompanhamentos inclusos.",
    nomeTamanhoPlaceholder: "Nome (ex: Marmitex M)", precoPlaceholder: "Preço (R$)",
    qtdAcompanhamentos: "Qtd. acompanhamentos", adicionarTamanho: "Adicionar tamanho",
    acompanhamentosLabel: "acompanhamentos", nenhumTamanho: "Nenhum tamanho cadastrado ainda.",
    pratosPrincipais: "Pratos principais", nomePrincipalPlaceholder: "Nome (ex: Polpette al Sugo)",
    adicionarPrincipal: "Adicionar principal", nenhumPrincipal: "Nenhum principal cadastrado ainda.",
    acompanhamentos: "Acompanhamentos", nomeAcompanhamentoPlaceholder: "Nome (ex: Arroz branco)",
    adicionarAcompanhamento: "Adicionar acompanhamento", nenhumAcompanhamento: "Nenhum acompanhamento cadastrado ainda.",
    extras: "Extras (cobrados à parte)", nomeExtraPlaceholder: "Nome (ex: Polpetta extra)",
    adicionarExtra: "Adicionar extra", nenhumExtra: "Nenhum extra cadastrado ainda.", excluir: "Excluir",
    cardapioSemana: "Cardápio da semana", cardapioSemanaDica: "Quais principais estão disponíveis em cada dia — repete toda semana.",
    nenhumPrincipalDefinido: "Nenhum principal definido.", principalPlaceholder: "Principal…",
    adicionarAoDia: "Adicionar a este dia", remover: "Remover",
  },
  it: {
    titulo: "Menu — Componi il Pranzo",
    descricao: "Definisci i formati di cestino, i piatti principali, i contorni e gli extra. Poi componi l'agenda della settimana indicando quali principali sono disponibili ogni giorno.",
    nomeMenu: "Nome del menu", nomeMenuDescricao: "Il nome che appare sul sito per il cliente — può essere diverso dal nome ufficiale della tua attività.",
    nomeMenuPlaceholder: "Es: Menu della Nonna", salvarNome: "Salva nome",
    tamanhos: "Formati di cestino", tamanhosDica: "Es: Cestino M — €18,00 — 3 contorni inclusi.",
    nomeTamanhoPlaceholder: "Nome (es: Cestino M)", precoPlaceholder: "Prezzo (EUR)",
    qtdAcompanhamentos: "Numero di contorni", adicionarTamanho: "Aggiungi formato",
    acompanhamentosLabel: "contorni", nenhumTamanho: "Nessun formato registrato ancora.",
    pratosPrincipais: "Piatti principali", nomePrincipalPlaceholder: "Nome (es: Polpette al Sugo)",
    adicionarPrincipal: "Aggiungi principale", nenhumPrincipal: "Nessun piatto principale registrato ancora.",
    acompanhamentos: "Contorni", nomeAcompanhamentoPlaceholder: "Nome (es: Riso bianco)",
    adicionarAcompanhamento: "Aggiungi contorno", nenhumAcompanhamento: "Nessun contorno registrato ancora.",
    extras: "Extra (a pagamento separato)", nomeExtraPlaceholder: "Nome (es: Polpetta extra)",
    adicionarExtra: "Aggiungi extra", nenhumExtra: "Nessun extra registrato ancora.", excluir: "Elimina",
    cardapioSemana: "Menu della settimana", cardapioSemanaDica: "Quali principali sono disponibili ogni giorno — si ripete ogni settimana.",
    nenhumPrincipalDefinido: "Nessun principale definito.", principalPlaceholder: "Principale…",
    adicionarAoDia: "Aggiungi a questo giorno", remover: "Rimuovi",
  },
};

export default async function CardapioPage() {
  const { supabase, locale } = await requireRestaurantSubscription("cardapio");
  const t = CONTEUDO[locale];
  const diasSemana = DIAS_SEMANA[locale];
  const formatReal = (value: number) => formatMoney(value, locale);

  const [{ data: products }, { data: cardapioSemana }, { data: pricingConfig }] = await Promise.all([
    supabase.from("del_products").select("*").order("nome"),
    supabase.from("del_cardapio_semana").select("*, del_products(nome)").order("dia_semana"),
    supabase.from("del_pricing_config").select("nome_negocio").maybeSingle(),
  ]);
  const nomeMenu = pricingConfig?.nome_negocio ?? "";

  const tamanhos = (products ?? []).filter((p) => p.categoria === "tamanho");
  // Pratos já cadastrados como "prato" (menu normal) também valem como
  // principal do Monte seu Pranzo — não precisa recadastrar.
  const principais = (products ?? []).filter((p) => p.categoria === "principal" || p.categoria === "prato");
  const acompanhamentos = (products ?? []).filter((p) => p.categoria === "acompanhamento");
  const extras = (products ?? []).filter((p) => p.categoria === "extra");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">{t.nomeMenu}</h2>
        <p className="mt-1 text-sm text-stone-600">
          {t.nomeMenuDescricao}
        </p>
        <form action={updateNomeMenu} className="mt-2 flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-4">
          <input
            name="nome_menu"
            defaultValue={nomeMenu}
            placeholder={t.nomeMenuPlaceholder}
            className="min-w-48 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98]">
            {t.salvarNome}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.tamanhos}</h2>
        <p className="mt-1 text-xs text-stone-500">{t.tamanhosDica}</p>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <input type="hidden" name="categoria" value="tamanho" />
          <input name="nome" required placeholder={t.nomeTamanhoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="preco" type="number" step="0.01" min="0" required placeholder={t.precoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="max_acompanhamentos" type="number" step="1" min="1" required placeholder={t.qtdAcompanhamentos} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-3">
            {t.adicionarTamanho}
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {tamanhos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome} — {formatReal(Number(p.preco))} — {p.max_acompanhamentos} {t.acompanhamentosLabel}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
              </form>
            </div>
          ))}
          {tamanhos.length === 0 && <p className="text-sm text-stone-500">{t.nenhumTamanho}</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.pratosPrincipais}</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="principal" />
          <input name="nome" required placeholder={t.nomePrincipalPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            {t.adicionarPrincipal}
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {principais.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
              </form>
            </div>
          ))}
          {principais.length === 0 && <p className="text-sm text-stone-500">{t.nenhumPrincipal}</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.acompanhamentos}</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="acompanhamento" />
          <input name="nome" required placeholder={t.nomeAcompanhamentoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            {t.adicionarAcompanhamento}
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {acompanhamentos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
              </form>
            </div>
          ))}
          {acompanhamentos.length === 0 && <p className="text-sm text-stone-500">{t.nenhumAcompanhamento}</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.extras}</h2>
        <form action={addProduct} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input type="hidden" name="categoria" value="extra" />
          <input name="nome" required placeholder={t.nomeExtraPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="preco" type="number" step="0.01" min="0" required placeholder={t.precoPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            {t.adicionarExtra}
          </button>
        </form>
        <div className="mt-2 space-y-1.5">
          {extras.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <span>{p.nome} — {formatReal(Number(p.preco))}</span>
              <form action={deleteProduct.bind(null, p.id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
              </form>
            </div>
          ))}
          {extras.length === 0 && <p className="text-sm text-stone-500">{t.nenhumExtra}</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">{t.cardapioSemana}</h2>
        <p className="mt-1 text-xs text-stone-500">{t.cardapioSemanaDica}</p>
        <div className="mt-2 space-y-3">
          {diasSemana.map((label, diaSemana) => {
            const itensDoDia = (cardapioSemana ?? []).filter((c) => c.dia_semana === diaSemana);
            return (
              <div key={diaSemana} className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="font-medium text-stone-900">{label}</h3>
                <div className="mt-2 space-y-1">
                  {itensDoDia.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm text-stone-600">
                      <span>{c.del_products?.nome ?? "?"}</span>
                      <form action={removeCardapioDia.bind(null, c.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">{t.remover}</button>
                      </form>
                    </div>
                  ))}
                  {itensDoDia.length === 0 && <p className="text-sm text-stone-500">{t.nenhumPrincipalDefinido}</p>}
                </div>
                <form action={addCardapioDia} className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                  <input type="hidden" name="dia_semana" value={diaSemana} />
                  <select name="product_id" required className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                    <option value="">{t.principalPlaceholder}</option>
                    {principais.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
                    {t.adicionarAoDia}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
