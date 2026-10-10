import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRestaurantSubscription, MODULOS_RESTAURANTE, type ModuloRestaurante, type RestauranteLocale } from "@/lib/subscription";
import { addStaff, removeStaff, toggleStaffGerente, updateStaffModulos } from "@/app/restaurante/actions";

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
  titulo: string; descricao: React.ReactNode; emailPlaceholder: string; nomeOpcional: string; darAcesso: string;
  gerente: string; tirarGerente: string; tornarGerente: string; removerAcesso: string; salvarModulos: string;
  ninguemAcesso: string; verAtividade: string;
}> = {
  "pt-BR": {
    titulo: "Equipe",
    descricao: <>Pessoas que podem acessar e trabalhar no seu restaurante com o próprio login. Para dar acesso a alguém, cadastre o e-mail aqui — a pessoa só precisa criar uma conta em incassa.eu/criar-conta usando esse mesmo e-mail. Marque abaixo quais módulos cada pessoa pode ver (ex: responsável pelo caixa → Caixa e Vendas; chef → só Cozinha). Marcar alguém como <strong>gerente</strong> libera editar e excluir dentro dos módulos que ela acessa, e permite que essa pessoa também conceda módulos e gerência pra outros da equipe.</>,
    emailPlaceholder: "E-mail da pessoa", nomeOpcional: "Nome (opcional)", darAcesso: "Dar acesso",
    gerente: "Gerente", tirarGerente: "Tirar gerente", tornarGerente: "Tornar gerente",
    removerAcesso: "Remover acesso", salvarModulos: "Salvar módulos",
    ninguemAcesso: "Ninguém com acesso ainda, além de você.",
    verAtividade: "Ver atividade da equipe (quem fez o quê)",
  },
  it: {
    titulo: "Team",
    descricao: <>Persone che possono accedere e lavorare nel tuo ristorante con il proprio login. Per dare accesso a qualcuno, registra l&apos;e-mail qui — la persona deve solo creare un account su incassa.eu/criar-conta usando la stessa e-mail. Seleziona sotto quali moduli ogni persona può vedere (es: responsabile cassa → Cassa e Vendite; chef → solo Cucina). Segnare qualcuno come <strong>gestore</strong> permette di modificare ed eliminare nei moduli a cui ha accesso, e permette anche a quella persona di concedere moduli e gestione ad altri del team.</>,
    emailPlaceholder: "E-mail della persona", nomeOpcional: "Nome (opzionale)", darAcesso: "Dai accesso",
    gerente: "Gestore", tirarGerente: "Rimuovi gestore", tornarGerente: "Rendi gestore",
    removerAcesso: "Rimuovi accesso", salvarModulos: "Salva moduli",
    ninguemAcesso: "Nessuno con accesso ancora, oltre a te.",
    verAtividade: "Vedi attività del team (chi ha fatto cosa)",
  },
};

export default async function EquipePage() {
  const { supabase, restaurantOwnerId, isOwner, isGerente, locale } = await requireRestaurantSubscription();
  const t = CONTEUDO[locale];
  const labelModulo = LABEL_MODULO[locale];

  if (!isOwner && !isGerente) {
    redirect("/restaurante");
  }

  const { data: staff } = await supabase
    .from("del_staff")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <Link href="/restaurante/equipe/atividade" className="mt-3 inline-block text-sm text-amber-700 underline underline-offset-2">
        {t.verAtividade}
      </Link>

      {isOwner && (
        <form action={addStaff} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="email" type="email" required placeholder={t.emailPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="nome" placeholder={t.nomeOpcional} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            {t.darAcesso}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {(staff ?? []).map((s) => (
          <div key={s.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {s.nome || s.email}
                  {s.gerente && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      {t.gerente}
                    </span>
                  )}
                </p>
                {s.nome && <p className="text-sm text-stone-500">{s.email}</p>}
              </div>
              <div className="flex items-center gap-3">
                <form action={toggleStaffGerente.bind(null, s.id, s.gerente)}>
                  <button type="submit" className="text-xs text-amber-700 hover:underline">
                    {s.gerente ? t.tirarGerente : t.tornarGerente}
                  </button>
                </form>
                {isOwner && (
                  <form action={removeStaff.bind(null, s.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">
                      {t.removerAcesso}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <form action={updateStaffModulos.bind(null, s.id)} className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
              {MODULOS_RESTAURANTE.map((modulo) => (
                <label key={modulo} className="flex items-center gap-1.5 text-xs text-stone-600">
                  <input
                    type="checkbox"
                    name="modulos"
                    value={modulo}
                    defaultChecked={(s.modulos ?? []).includes(modulo)}
                  />
                  {labelModulo[modulo]}
                </label>
              ))}
              <button type="submit" className="rounded-md bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200">
                {t.salvarModulos}
              </button>
            </form>
          </div>
        ))}
        {(staff ?? []).length === 0 && <p className="text-sm text-stone-500">{t.ninguemAcesso}</p>}
      </div>
    </div>
  );
}
