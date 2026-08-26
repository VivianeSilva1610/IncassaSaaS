import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { addUscita, updateUscita, markUscitaPagata, deleteUscita } from "@/app/app/actions";
import { formatEuro, getUrgency, urgencyEmoji } from "@/lib/urgency";

export default async function UscitePage() {
  await requireActiveSubscription();
  const supabase = await createClient();
  const { data: uscite } = await supabase.from("uscite").select("*").order("data_scadenza");

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Uscite</h1>
      <p className="mt-1 text-sm text-stone-600">
        Le fatture che devi pagare tu — fornitori, materiali, tutto quello che ti aiuta a sapere
        quanto ti resterà davvero. È una stima che inserisci tu: non sostituisce il tuo
        commercialista.
      </p>

      <form action={addUscita} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <input name="descrizione" required placeholder="Descrizione (es. Fornitore materiali)" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <input name="importo" type="number" step="0.01" min="0" required placeholder="Importo (€)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="data_scadenza" type="date" required className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Aggiungi uscita
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
                  {formatEuro(Number(u.importo))} · scade {u.data_scadenza}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                    Modifica
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
                    <input
                      name="data_scadenza"
                      type="date"
                      required
                      defaultValue={u.data_scadenza}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
                    >
                      Salva
                    </button>
                  </form>
                </details>
                {u.status === "da_pagare" && (
                  <form action={markUscitaPagata.bind(null, u.id)}>
                    <button type="submit" className="text-xs text-emerald-700 hover:underline">
                      Segna pagata
                    </button>
                  </form>
                )}
                <form action={deleteUscita.bind(null, u.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(uscite ?? []).length === 0 && <p className="text-sm text-stone-500">Nessuna uscita ancora.</p>}
      </div>
    </div>
  );
}
