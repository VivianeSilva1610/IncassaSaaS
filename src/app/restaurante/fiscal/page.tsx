import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { updateFiscalConfig, updateProductFiscal } from "@/app/restaurante/actions";

function formatHora(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  emitida: "Emitida",
  erro: "Erro",
  cancelada: "Cancelada",
};

export default async function FiscalPage() {
  const { supabase, restaurantOwnerId, isOwner } = await requireRestaurantSubscription();

  if (!isOwner) {
    redirect("/restaurante");
  }

  const [{ data: config }, { data: products }, { data: notas }] = await Promise.all([
    supabase.from("del_fiscal_config").select("*").eq("owner_id", restaurantOwnerId).maybeSingle(),
    supabase.from("del_products").select("id, nome, categoria, ncm, cfop, cest, origem").order("nome"),
    supabase
      .from("del_notas_fiscais")
      .select("*, del_orders(cliente_nome, totale)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const pronto = !!(config?.cnpj && config?.inscricao_estadual && config?.provedor);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Fiscal</h1>
      <p className="mt-1 text-sm text-stone-600">
        Base para emissão de NFC-e. Hoje o regime é MEI, sem Inscrição Estadual — nada aqui emite nota de
        verdade até você ter CNPJ com IE, certificado digital e um provedor de NFC-e contratado.
      </p>

      <div className={`mt-4 rounded-lg border p-3 text-sm ${pronto ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
        {pronto
          ? "Dados básicos preenchidos e provedor selecionado — falta só a integração técnica com o provedor para emitir de verdade."
          : "Ainda falta CNPJ, Inscrição Estadual e/ou provedor para deixar a emissão pronta."}
      </div>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-semibold text-stone-900">Exportar para o contador</h2>
        <p className="mt-1 text-xs text-stone-500">
          Planilha com todos os pedidos do período (valor, cliente, status da nota fiscal quando houver) —
          útil pro seu contador acompanhar o faturamento do MEI mesmo antes da emissão de NFC-e estar ativa.
        </p>
        <form action="/api/restaurante/export-vendas" method="get" className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-stone-500">De</label>
            <input type="date" name="from" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-stone-500">Até</label>
            <input type="date" name="to" className="rounded-md border border-stone-300 px-2 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
            Baixar CSV
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-stone-900">Dados do estabelecimento</h2>
        <form action={updateFiscalConfig} className="mt-2 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
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
            <input name="cep" defaultValue={config?.cep ?? ""} placeholder="CEP" className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm" />
          </div>

          <select name="provedor" defaultValue={config?.provedor ?? ""} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="">Nenhum provedor contratado ainda</option>
            <option value="focus_nfe">Focus NFe</option>
            <option value="plugnotas">PlugNotas</option>
            <option value="enotas">eNotas</option>
          </select>
          <select name="ambiente" defaultValue={config?.ambiente ?? "homologacao"} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="homologacao">Homologação (teste)</option>
            <option value="producao">Produção (nota real)</option>
          </select>

          <button type="submit" className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2">
            Salvar dados fiscais
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Classificação fiscal dos produtos</h2>
        <p className="mt-1 text-xs text-stone-500">
          NCM, CFOP, CEST e origem de cada item — necessários na nota. Os valores-padrão são só ponto de
          partida; revise com um contador antes de emitir em produção.
        </p>
        <div className="mt-2 space-y-1.5">
          {(products ?? []).map((p) => (
            <details key={p.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
              <summary className="cursor-pointer list-none">
                {p.nome} <span className="text-stone-400">— NCM {p.ncm || "—"} · CFOP {p.cfop} · origem {p.origem}</span>
              </summary>
              <form action={updateProductFiscal.bind(null, p.id)} className="mt-2 grid gap-2 border-t border-stone-100 pt-2 sm:grid-cols-4">
                <input name="ncm" defaultValue={p.ncm ?? ""} placeholder="NCM" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs" />
                <input name="cfop" defaultValue={p.cfop ?? "5102"} placeholder="CFOP" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs" />
                <input name="cest" defaultValue={p.cest ?? ""} placeholder="CEST (opcional)" className="rounded-md border border-stone-300 px-2 py-1.5 text-xs" />
                <select name="origem" defaultValue={p.origem ?? 0} className="rounded-md border border-stone-300 px-2 py-1.5 text-xs">
                  <option value="0">0 — Nacional</option>
                  <option value="1">1 — Estrangeira, importação direta</option>
                  <option value="2">2 — Estrangeira, adquirida no mercado interno</option>
                </select>
                <button type="submit" className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white sm:col-span-4">
                  Salvar
                </button>
              </form>
            </details>
          ))}
          {(products ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhum produto cadastrado ainda.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold text-stone-900">Notas fiscais</h2>
        <div className="mt-2 space-y-2">
          {(notas ?? []).map((n) => (
            <div key={n.id} className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium text-stone-900">
                  {n.del_orders?.cliente_nome || "Cliente sem nome"} — {STATUS_LABEL[n.status] ?? n.status}
                </p>
                <span className="text-xs text-stone-400">{formatHora(n.created_at)}</span>
              </div>
              {n.erro_mensagem && <p className="mt-1 text-xs text-red-600">{n.erro_mensagem}</p>}
              {n.chave_acesso && <p className="mt-1 text-xs text-stone-500">Chave: {n.chave_acesso}</p>}
            </div>
          ))}
          {(notas ?? []).length === 0 && <p className="text-sm text-stone-500">Nenhuma nota emitida ou tentada ainda.</p>}
        </div>
      </section>
    </div>
  );
}
