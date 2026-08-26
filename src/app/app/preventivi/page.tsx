import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { addPreventivo, updatePreventivo, updatePreventivoStatus, deletePreventivo } from "@/app/app/actions";
import { formatEuro } from "@/lib/urgency";

const statusLabel: Record<string, string> = {
  in_attesa: "⏳ In attesa",
  accettato: "✅ Accettato",
  rifiutato: "❌ Rifiutato",
};

export default async function PreventiviPage() {
  await requireActiveSubscription();
  const supabase = await createClient();

  const [{ data: clients }, { data: quotes }] = await Promise.all([
    supabase.from("clients").select("id, nome").order("nome"),
    supabase.from("quotes").select("*, clients(nome)").order("data_invio"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Preventivi</h1>

      <form action={addPreventivo} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <select name="client_id" required className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">Seleziona cliente…</option>
          {(clients ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <input name="importo" type="number" step="0.01" min="0" required placeholder="Importo (€)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="data_invio" type="date" required className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="numero" placeholder="Numero preventivo (opzionale)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="descrizione" placeholder="Descrizione (opzionale)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input
          name="luogo_lavoro"
          placeholder="Luogo del lavoro (lascia vuoto se uguale all'indirizzo del cliente)"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Aggiungi preventivo
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(quotes ?? []).map((q) => (
          <div key={q.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">
                  {statusLabel[q.status]} {q.clients?.nome}
                </p>
                <p className="text-sm text-stone-500">
                  {q.numero ? `n. ${q.numero} · ` : ""}
                  {formatEuro(Number(q.importo))} · inviato {q.data_invio}
                  {q.descrizione ? ` · ${q.descrizione}` : ""}
                  {q.luogo_lavoro ? ` · ${q.luogo_lavoro}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="relative">
                  <summary className="cursor-pointer list-none text-xs text-amber-700 hover:underline">
                    Modifica
                  </summary>
                  <form
                    action={updatePreventivo.bind(null, q.id)}
                    className="absolute right-0 z-10 mt-2 grid w-72 gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-lg"
                  >
                    <select name="client_id" required defaultValue={q.client_id} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">
                      {(clients ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <input
                      name="importo"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={q.importo}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="data_invio"
                      type="date"
                      required
                      defaultValue={q.data_invio}
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="numero"
                      defaultValue={q.numero ?? ""}
                      placeholder="Numero preventivo"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="descrizione"
                      defaultValue={q.descrizione ?? ""}
                      placeholder="Descrizione"
                      className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      name="luogo_lavoro"
                      defaultValue={q.luogo_lavoro ?? ""}
                      placeholder="Luogo del lavoro"
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
                {q.status === "in_attesa" && (
                  <>
                    <form action={updatePreventivoStatus.bind(null, q.id, "accettato")}>
                      <button type="submit" className="text-xs text-emerald-700 hover:underline">
                        Accettato
                      </button>
                    </form>
                    <form action={updatePreventivoStatus.bind(null, q.id, "rifiutato")}>
                      <button type="submit" className="text-xs text-stone-500 hover:underline">
                        Rifiutato
                      </button>
                    </form>
                  </>
                )}
                <form action={deletePreventivo.bind(null, q.id)}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Elimina
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(quotes ?? []).length === 0 && <p className="text-sm text-stone-500">Nessun preventivo ancora.</p>}
      </div>
    </div>
  );
}
