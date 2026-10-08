import { requireRestaurantSubscription, type RestauranteLocale } from "@/lib/subscription";
import { addContaAReceber, updateContaAReceber, marcarContaAReceberPaga, deleteContaAReceber } from "@/app/restaurante/actions";
import { SollecitaButtonRestaurante } from "@/components/SollecitaButtonRestaurante";
import { getUrgency, urgencyEmoji } from "@/lib/urgency";

const CONTEUDO: Record<RestauranteLocale, {
  titulo: string; descricao: string; totalAberto: string; clientePlaceholder: string; telefoneOpcional: string;
  valorPlaceholder: string; vencimento: string; lancarConta: string; editar: string; salvar: string;
  marcarPaga: string; excluir: string; nenhumaConta: string; vence: (data: string) => string;
}> = {
  "pt-BR": {
    titulo: "Contas a receber",
    descricao: "Pedidos vendidos a prazo. Pedidos lançados em Vendas com \"a prazo\" marcado caem aqui automaticamente — você também pode lançar um na mão.",
    totalAberto: "Total em aberto", clientePlaceholder: "Cliente", telefoneOpcional: "Telefone (opcional)",
    valorPlaceholder: "Valor (R$)", vencimento: "Vencimento", lancarConta: "Lançar conta", editar: "Editar",
    salvar: "Salvar", marcarPaga: "Marcar paga", excluir: "Excluir", nenhumaConta: "Nenhuma conta lançada ainda.",
    vence: (data) => `vence ${data}`,
  },
  it: {
    titulo: "Crediti",
    descricao: "Ordini venduti a credito. Gli ordini registrati in Vendite con \"a credito\" selezionato arrivano qui automaticamente — puoi anche registrarne uno manualmente.",
    totalAberto: "Totale aperto", clientePlaceholder: "Cliente", telefoneOpcional: "Telefono (opzionale)",
    valorPlaceholder: "Importo (EUR)", vencimento: "Scadenza", lancarConta: "Registra credito", editar: "Modifica",
    salvar: "Salva", marcarPaga: "Segna come pagato", excluir: "Elimina", nenhumaConta: "Nessun credito registrato ancora.",
    vence: (data) => `scade ${data}`,
  },
};

export default async function ContasAReceberPage() {
  const { supabase, restaurantOwnerId, isGerente, locale } = await requireRestaurantSubscription("financeiro");
  const t = CONTEUDO[locale];
  const formatReal = (value: number) => (locale === "it"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value));

  const { data: contas } = await supabase
    .from("del_contas_a_receber")
    .select("*")
    .eq("owner_id", restaurantOwnerId)
    .order("data_vencimento");

  const totalAberto = (contas ?? [])
    .filter((c) => c.status === "aberta")
    .reduce((sum, c) => sum + Number(c.valor), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.titulo}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {t.descricao}
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
        <p className="text-sm text-stone-500">{t.totalAberto}</p>
        <p className="mt-1 text-2xl font-bold text-stone-900">{formatReal(totalAberto)}</p>
      </div>

      {isGerente && (
        <form action={addContaAReceber} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
          <input name="cliente_nome" required placeholder={t.clientePlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="cliente_telefone" placeholder={t.telefoneOpcional} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="valor" type="number" step="0.01" min="0" required placeholder={t.valorPlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <label className="text-sm text-stone-600">
            <span className="mb-1 block text-xs text-stone-500">{t.vencimento}</span>
            <input name="data_vencimento" type="date" required className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
          >
            {t.lancarConta}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {(contas ?? []).map((c) => (
          <div key={c.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {c.status === "aberta" && urgencyEmoji[getUrgency(c.data_vencimento)]} {c.cliente_nome}
                  {c.status === "paga" && " ✅"}
                </p>
                <p className="text-sm text-stone-500">
                  {formatReal(Number(c.valor))} · {t.vence(c.data_vencimento)}
                  {c.cliente_telefone && ` · ${c.cliente_telefone}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.status === "aberta" && <SollecitaButtonRestaurante contaId={c.id} locale={locale} />}
                {isGerente && (
                  <>
                    <details className="relative">
                      <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">{t.editar}</summary>
                      <form
                        action={updateContaAReceber.bind(null, c.id)}
                        className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                      >
                        <input name="cliente_nome" required defaultValue={c.cliente_nome} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <input name="cliente_telefone" defaultValue={c.cliente_telefone ?? ""} placeholder={t.telefoneOpcional} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <input name="valor" type="number" step="0.01" min="0" required defaultValue={c.valor} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
                        <label className="text-xs text-stone-500">
                          {t.vencimento}
                          <input name="data_vencimento" type="date" required defaultValue={c.data_vencimento} className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900" />
                        </label>
                        <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700">
                          {t.salvar}
                        </button>
                      </form>
                    </details>
                    {c.status === "aberta" && (
                      <form action={marcarContaAReceberPaga.bind(null, c.id)}>
                        <button type="submit" className="text-xs text-emerald-700 hover:underline">{t.marcarPaga}</button>
                      </form>
                    )}
                    <form action={deleteContaAReceber.bind(null, c.id)}>
                      <button type="submit" className="text-xs text-red-600 hover:underline">{t.excluir}</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {(contas ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nenhumaConta}</p>}
      </div>
    </div>
  );
}
