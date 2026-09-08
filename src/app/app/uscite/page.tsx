import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { getUserLocale } from "@/lib/locale";
import { addUscita, updateUscita, markUscitaPagata, deleteUscita } from "@/app/app/actions";
import { formatEuro, getUrgency, urgencyEmoji } from "@/lib/urgency";

const strings = {
  it: {
    title: "Uscite",
    intro:
      "Le fatture che devi pagare tu — fornitori, materiali, tutto quello che ti aiuta a sapere " +
      "quanto ti resterà davvero. È una stima che inserisci tu: non sostituisce il tuo commercialista.",
    descrizionePlaceholder: "Descrizione (es. Fornitore materiali)",
    importo: "Importo (€)",
    entroQuando: "Entro quando devi pagarla",
    aggiungiUscita: "Aggiungi uscita",
    modifica: "Modifica",
    salva: "Salva",
    segnaPagata: "Segna pagata",
    elimina: "Elimina",
    nessunaUscita: "Nessuna uscita ancora.",
    scade: "scade",
  },
  en: {
    title: "Expenses",
    intro:
      "The bills you have to pay — suppliers, materials, anything that helps you know what you'll " +
      "actually have left. It's an estimate you enter yourself: it doesn't replace your accountant.",
    descrizionePlaceholder: "Description (e.g. Materials supplier)",
    importo: "Amount (€)",
    entroQuando: "Due by",
    aggiungiUscita: "Add expense",
    modifica: "Edit",
    salva: "Save",
    segnaPagata: "Mark as paid",
    elimina: "Delete",
    nessunaUscita: "No expenses yet.",
    scade: "due",
  },
};

export default async function UscitePage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = user ? await getUserLocale(supabase, user.id) : "it";
  const t = strings[locale];

  const { data: uscite } = await supabase.from("uscite").select("*").order("data_scadenza");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t.title}</h1>
      <p className="mt-1 text-sm text-stone-600">{t.intro}</p>

      <form action={addUscita} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="descrizione" required placeholder={t.descrizionePlaceholder} className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <input name="importo" type="number" step="0.01" min="0" required placeholder={t.importo} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{t.entroQuando}</span>
          <input name="data_scadenza" type="date" required className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          {t.aggiungiUscita}
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(uscite ?? []).map((u) => (
          <div key={u.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {u.status === "da_pagare" && urgencyEmoji[getUrgency(u.data_scadenza)]} {u.descrizione}
                  {u.status === "pagata" && " ✅"}
                </p>
                <p className="text-sm text-stone-500">
                  {formatEuro(Number(u.importo))} · {t.scade} {u.data_scadenza}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                    {t.modifica}
                  </summary>
                  <form
                    action={updateUscita.bind(null, u.id)}
                    className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                  >
                    <input
                      name="descrizione"
                      required
                      defaultValue={u.descrizione}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="importo"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={u.importo}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <label className="text-xs text-stone-500">
                      {t.entroQuando}
                      <input
                        name="data_scadenza"
                        type="date"
                        required
                        defaultValue={u.data_scadenza}
                        className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm text-stone-900"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
                    >
                      {t.salva}
                    </button>
                  </form>
                </details>
                {u.status === "da_pagare" && (
                  <form action={markUscitaPagata.bind(null, u.id)}>
                    <button type="submit" className="text-xs text-emerald-700 hover:underline">
                      {t.segnaPagata}
                    </button>
                  </form>
                )}
                <form action={deleteUscita.bind(null, u.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    {t.elimina}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(uscite ?? []).length === 0 && <p className="text-sm text-stone-500">{t.nessunaUscita}</p>}
      </div>
    </div>
  );
}
