import { updateFiscalConfig, updateFiscalConfigIt } from "@/app/restaurante/actions";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { DetectarPaisForm } from "./detectar-pais-form";

export default async function EstabelecimentoFiscalPage() {
  const { supabase, restaurantOwnerId } = await requireRestaurantSubscription();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, country_code, country_confirmed")
    .eq("owner_user_id", restaurantOwnerId)
    .maybeSingle();

  if (restaurant && !restaurant.country_confirmed) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dados do estabelecimento / Dati fiscali</h1>
        <p className="mt-1 text-sm text-stone-600">
          Primeiro passo: identificar o país do restaurante, pra te mostrar o módulo fiscal certo.
          <br />
          Primo passo: identificare il paese del ristorante, per mostrarti il modulo fiscale giusto.
        </p>
        <div className="mt-6">
          <DetectarPaisForm />
        </div>
      </div>
    );
  }

  if (restaurant?.country_code === "IT") {
    const { data: configIt } = await supabase
      .from("restaurant_fiscal_it")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();
    const completoIt = !!(configIt?.partita_iva && configIt?.codice_fiscale && configIt?.ragione_sociale);

    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dati fiscali</h1>
        <p className="mt-1 text-sm text-stone-600">Inserisci l&apos;emittente, la Partita IVA, il regime e il provider di fattura elettronica.</p>

        <div className={`mt-4 rounded-lg border p-3 text-sm ${completoIt ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
          {completoIt
            ? "Anagrafica di base completata. La produzione resta bloccata finché omologazione e validazione con il commercialista non sono completate."
            : "Completa Ragione Sociale, Partita IVA e Codice Fiscale per preparare la validazione con il commercialista."}
        </div>

        <form action={updateFiscalConfigIt} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
          <input name="ragione_sociale" defaultValue={configIt?.ragione_sociale ?? ""} placeholder="Ragione sociale" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="partita_iva" defaultValue={configIt?.partita_iva ?? ""} placeholder="Partita IVA" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="codice_fiscale" defaultValue={configIt?.codice_fiscale ?? ""} placeholder="Codice Fiscale" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <select name="regime_fiscale" defaultValue={configIt?.regime_fiscale ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="">Regime fiscale — da confermare con il commercialista</option>
            <option value="RF01">RF01 — Ordinario</option>
            <option value="RF19">RF19 — Forfettario</option>
          </select>
          <input name="pec" defaultValue={configIt?.pec ?? ""} placeholder="PEC" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <input name="codice_destinatario" defaultValue={configIt?.codice_destinatario ?? ""} placeholder="Codice Destinatario (SdI)" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          <select name="provedor" defaultValue={configIt?.provedor ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="">Nessun provider contrattato</option>
            <option value="simulado">🧪 Simulazione</option>
          </select>
          <select name="ambiente" defaultValue="homologacao" className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="homologacao">Omologazione (test)</option>
            <option value="producao" disabled>Produzione (bloccata)</option>
          </select>
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white sm:col-span-2">Salva dati fiscali</button>
        </form>
      </div>
    );
  }

  const { data: config } = await supabase.from("del_fiscal_config").select("*").eq("owner_id", restaurantOwnerId).maybeSingle();
  const completo = !!(config?.cnpj && config?.razao_social && config?.municipio && config?.uf);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Dados do estabelecimento</h1>
      <p className="mt-1 text-sm text-stone-600">Cadastre o emitente, endereço, regime e integração fiscal.</p>

      <div className={`mt-4 rounded-lg border p-3 text-sm ${completo ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
        {completo
          ? "Cadastro básico preenchido. A produção continua bloqueada até a homologação e validação fiscal."
          : "Complete CNPJ, razão social, município e UF para preparar a validação com o contador."}
      </div>

      <form action={updateFiscalConfig} className="mt-6 grid gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <input name="razao_social" defaultValue={config?.razao_social ?? ""} placeholder="Razão social" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="nome_fantasia" defaultValue={config?.nome_fantasia ?? ""} placeholder="Nome fantasia" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="cnpj" defaultValue={config?.cnpj ?? ""} placeholder="CNPJ" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="inscricao_estadual" defaultValue={config?.inscricao_estadual ?? ""} placeholder="Inscrição Estadual" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <select name="regime_tributario" defaultValue={config?.regime_tributario ?? "mei"} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="mei">MEI</option>
          <option value="simples_nacional">Simples Nacional</option>
          <option value="normal">Regime Normal</option>
        </select>
        <select name="crt" defaultValue={config?.crt ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">CRT — confirmar com contador</option>
          <option value="1">1 — Simples Nacional</option>
          <option value="2">2 — Simples Nacional, excesso de sublimite</option>
          <option value="3">3 — Regime Normal</option>
        </select>
        <input name="logradouro" defaultValue={config?.logradouro ?? ""} placeholder="Logradouro" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <input name="numero" defaultValue={config?.numero ?? ""} placeholder="Número" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="bairro" defaultValue={config?.bairro ?? ""} placeholder="Bairro" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <input name="municipio" defaultValue={config?.municipio ?? ""} placeholder="Município" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <input name="uf" defaultValue={config?.uf ?? ""} placeholder="UF" maxLength={2} className="w-16 rounded-md border border-stone-300 px-3 py-2 text-sm uppercase" />
          <input name="cep" defaultValue={config?.cep ?? ""} placeholder="CEP" className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <select name="provedor" defaultValue={config?.provedor ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="">Nenhum provedor contratado</option>
          <option value="simulado">🧪 Simulação</option>
          <option value="focus_nfe">Focus NFe</option>
          <option value="plugnotas">PlugNotas</option>
          <option value="enotas">eNotas</option>
        </select>
        <select name="ambiente" defaultValue={config?.ambiente ?? "homologacao"} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
          <option value="homologacao">Homologação (teste)</option>
          <option value="producao" disabled>Produção (bloqueada)</option>
        </select>
        <label className="flex items-start gap-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700 sm:col-span-2">
          <input name="emissao_automatica" type="checkbox" defaultChecked={config?.emissao_automatica ?? false} className="mt-0.5" />
          <span>Emitir automaticamente após confirmar o pagamento. Ative somente depois da homologação e validação do contador.</span>
        </label>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white sm:col-span-2">Salvar dados fiscais</button>
      </form>
    </div>
  );
}
