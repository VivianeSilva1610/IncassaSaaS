import { requireActiveSubscription } from "@/lib/subscription";
import { createClient } from "@/lib/supabase-server";
import { addPreventivo, updatePreventivoStatus, deletePreventivo } from "@/app/app/actions";
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
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] sm:col-span-2"
        >
          Aggiungi preventivo
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {(quotes ?? []).map((q) => (
          <div key={q.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
            <div>
              <p className="font-medium text-stone-900">
                {statusLabel[q.status]} {q.clients?.nome}
              </p>
              <p className="text-sm text-stone-500">
                {q.numero ? `n. ${q.numero} · ` : ""}
                {formatEuro(Number(q.importo))} · inviato {q.data_invio}
                {q.descrizione ? ` · ${q.descrizione}` : ""}
              </p>
            </div>
            <div className="flex gap-3">
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
        ))}
        {(quotes ?? []).length === 0 && <p className="text-sm text-stone-500">Nessun preventivo ancora.</p>}
      </div>
    </div>
  );
}
