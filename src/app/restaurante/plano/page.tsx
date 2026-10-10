import { requireRestaurantSubscription, MODULOS_RESTAURANTE, type ModuloRestaurante, type RestauranteLocale } from "@/lib/subscription";
import { updateModulosAtivos } from "@/app/restaurante/actions";
import { AddonCheckoutButton } from "@/components/restaurante/AddonCheckoutButton";

const LABEL_MODULO: Record<RestauranteLocale, Record<ModuloRestaurante, string>> = {
  "pt-BR": {
    compras: "Compras", estoque: "Estoque", vendas: "Vendas", cardapio: "Menu do site", cozinha: "Cozinha",
    producao: "Produção", custos: "Custos", caixa: "Caixa", financeiro: "Financeiro", gestao: "Gestão", fiscal: "Fiscal",
  },
  it: {
    compras: "Acquisti", estoque: "Magazzino", vendas: "Vendite", cardapio: "Menu del sito", cozinha: "Cucina",
    producao: "Produzione", custos: "Costi", caixa: "Cassa", financeiro: "Finanza", gestao: "Gestione", fiscal: "Fiscale",
  },
};

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; bloqueadoAviso: (modulo: string) => string; pagamentoConfirmado: string;
  pagamentoCancelado: string;
  modulosTitulo: string; modulosDescricao: (n: number) => string; modulosIlimitados: string;
  modulosSelecionados: (n: number, limite: number) => string; salvarModulos: string; contratarModulos: string;
  equipeTitulo: string; equipeDescricao: (n: number, limite: number) => string; equipeIlimitada: string; contratarEquipe: string;
  abasTitulo: string; abasDescricao: string; abasIlimitadas: string; contratarAbas: string;
  carregando: string;
}> = {
  "pt-BR": {
    titulo: "Meu plano",
    descricao: "Limites do seu plano atual e complementos disponíveis.",
    bloqueadoAviso: (modulo) => `O módulo "${modulo}" não está incluso no seu plano atual — ative o complemento de módulos ilimitados abaixo pra acessar.`,
    pagamentoConfirmado: "Pagamento confirmado! Pode levar alguns segundos pra liberar — atualize a página se ainda não aparecer.",
    pagamentoCancelado: "Pagamento cancelado.",
    modulosTitulo: "Módulos", modulosDescricao: (n) => `Seu plano inclui até ${n} módulos do menu principal.`,
    modulosIlimitados: "Seu plano já inclui todos os módulos.",
    modulosSelecionados: (n, limite) => `${n}/${limite} selecionados`,
    salvarModulos: "Salvar módulos", contratarModulos: "Contratar módulos ilimitados",
    equipeTitulo: "Equipe", equipeDescricao: (n, limite) => `${n} de até ${limite} pessoas cadastradas sem custo extra.`,
    equipeIlimitada: "Sua equipe já é ilimitada.", contratarEquipe: "Contratar equipe ilimitada",
    abasTitulo: "Abas simultâneas", abasDescricao: "Até 3 abas abertas ao mesmo tempo por pessoa.",
    abasIlimitadas: "Suas abas já são ilimitadas.", contratarAbas: "Contratar abas ilimitadas",
    carregando: "Um momento…",
  },
  it: {
    titulo: "Il mio piano",
    descricao: "Limiti del tuo piano attuale e componenti aggiuntivi disponibili.",
    bloqueadoAviso: (modulo) => `Il modulo "${modulo}" non è incluso nel tuo piano attuale — attiva il componente aggiuntivo di moduli illimitati qui sotto per accedervi.`,
    pagamentoConfirmado: "Pagamento confermato! Potrebbe richiedere qualche secondo per attivarsi — aggiorna la pagina se non è ancora visibile.",
    pagamentoCancelado: "Pagamento annullato.",
    modulosTitulo: "Moduli", modulosDescricao: (n) => `Il tuo piano include fino a ${n} moduli del menu principale.`,
    modulosIlimitados: "Il tuo piano include già tutti i moduli.",
    modulosSelecionados: (n, limite) => `${n}/${limite} selezionati`,
    salvarModulos: "Salva moduli", contratarModulos: "Attiva moduli illimitati",
    equipeTitulo: "Team", equipeDescricao: (n, limite) => `${n} di massimo ${limite} persone registrate senza costo extra.`,
    equipeIlimitada: "Il tuo team è già illimitato.", contratarEquipe: "Attiva team illimitato",
    abasTitulo: "Schede simultanee", abasDescricao: "Fino a 3 schede aperte contemporaneamente per persona.",
    abasIlimitadas: "Le tue schede sono già illimitate.", contratarAbas: "Attiva schede illimitate",
    carregando: "Un momento…",
  },
};

const LIMITE_MODULOS = 3;
const LIMITE_EQUIPE = 3;

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ bloqueado?: string; addon?: string; sucesso?: string; checkout?: string }>;
}) {
  const { supabase, restaurantOwnerId, isOwner, locale, modulosAtivos, addonModulosIlimitados, addonEquipeIlimitada, addonAbasIlimitadas } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];
  const labelModulo = LABEL_MODULO[locale];
  const params = await searchParams;

  const { count: totalEquipe } = await supabase.from("del_staff").select("id", { count: "exact", head: true }).eq("owner_id", restaurantOwnerId);

  const botaoClasse = "rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white";

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.descricao}</p>

      {params.bloqueado && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t.bloqueadoAviso(labelModulo[params.bloqueado as ModuloRestaurante] ?? params.bloqueado)}
        </p>
      )}
      {params.sucesso === "1" && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{t.pagamentoConfirmado}</p>}
      {params.checkout === "cancelled" && <p className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">{t.pagamentoCancelado}</p>}

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-stone-900">{t.modulosTitulo}</h2>
          {!addonModulosIlimitados && isOwner && (
            <span className="text-xs text-stone-500">{t.modulosSelecionados(modulosAtivos.length, LIMITE_MODULOS)}</span>
          )}
        </div>
        {addonModulosIlimitados ? (
          <p className="mt-2 text-sm text-emerald-700">{t.modulosIlimitados}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-stone-600">{t.modulosDescricao(LIMITE_MODULOS)}</p>
            {isOwner && (
              <form action={updateModulosAtivos} className="mt-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  {MODULOS_RESTAURANTE.map((modulo) => (
                    <label key={modulo} className="flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-700">
                      <input type="checkbox" name={`modulo_${modulo}`} defaultChecked={modulosAtivos.includes(modulo)} />
                      {labelModulo[modulo]}
                    </label>
                  ))}
                </div>
                <button type="submit" className={`${botaoClasse} mt-3`}>{t.salvarModulos}</button>
              </form>
            )}
            {isOwner && (
              <div className="mt-3">
                <AddonCheckoutButton tipo="modulos" label={t.contratarModulos} loadingLabel={t.carregando} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700" />
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">{t.equipeTitulo}</h2>
        {addonEquipeIlimitada ? (
          <p className="mt-2 text-sm text-emerald-700">{t.equipeIlimitada}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-stone-600">{t.equipeDescricao(totalEquipe ?? 0, LIMITE_EQUIPE)}</p>
            {isOwner && (
              <div className="mt-3">
                <AddonCheckoutButton tipo="equipe" label={t.contratarEquipe} loadingLabel={t.carregando} className={botaoClasse} />
              </div>
            )}
          </>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold text-stone-900">{t.abasTitulo}</h2>
        {addonAbasIlimitadas ? (
          <p className="mt-2 text-sm text-emerald-700">{t.abasIlimitadas}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-stone-600">{t.abasDescricao}</p>
            {isOwner && (
              <div className="mt-3">
                <AddonCheckoutButton tipo="abas" label={t.contratarAbas} loadingLabel={t.carregando} className={botaoClasse} />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
