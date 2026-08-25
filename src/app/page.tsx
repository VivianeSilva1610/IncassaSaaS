import { messages } from "@/content/kit-incassa";
import { CheckoutButton } from "@/components/CheckoutButton";

const previewIds = ["ritardo-lieve-cordiale", "secondo-sollecito-diretto", "cliente-abituale-gentile"];
const previewMessages = previewIds.map((id) => messages.find((m) => m.id === id)!);

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="text-center">
        <p className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Per idraulici, elettricisti, imprese edili e artigiani
        </p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">
          Kit Incassa
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
          37 messaggi pronti per farti pagare senza rovinare il rapporto con il cliente.
        </p>
        <div className="mt-8 flex flex-col items-center gap-2">
          <CheckoutButton className="rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-60" />
          <span className="text-xs text-neutral-400">Pagamento unico di €9 · accesso immediato</span>
        </div>
      </section>

      <section className="mt-16 rounded-xl bg-neutral-50 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-neutral-900">Ti suona familiare?</h2>
        <ul className="mt-4 space-y-2 text-neutral-700">
          <li>Un cliente ha visualizzato il tuo messaggio e non ha più risposto.</li>
          <li>Non sai come scrivere un sollecito senza sembrare aggressivo.</li>
          <li>Hai lavori pagati in ritardo di settimane e non sai come chiedere senza rovinare il rapporto.</li>
        </ul>
        <p className="mt-4 text-neutral-700">
          Il Kit Incassa ti dà la frase giusta per ogni situazione: ritardo lieve o grave, cliente
          abituale o nuovo, azienda o privato — in quattro toni diversi, da scegliere in base al
          rapporto che hai con il cliente.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-xl font-semibold text-neutral-900">Alcuni esempi</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {previewMessages.map((message) => (
            <div key={message.id} className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
              {message.text}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-xl border border-neutral-200 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-neutral-900">Cosa ricevi</h2>
        <ul className="mt-4 space-y-2 text-neutral-700">
          <li>✅ 37 messaggi pronti, divisi per situazione (ritardo, sollecito, promesse non mantenute, aziende, privati e altro)</li>
          <li>✅ 4 toni diversi: Gentile, Cordiale, Diretto, Formale</li>
          <li>✅ Accesso immediato dopo il pagamento + copia via email</li>
          <li>✅ Pronti da copiare, incollare e personalizzare su WhatsApp o email</li>
        </ul>
        <div className="mt-8 flex justify-center">
          <CheckoutButton className="rounded-lg bg-neutral-900 px-6 py-3 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-60" />
        </div>
      </section>
    </main>
  );
}
