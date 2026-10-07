export default function ExportacaoFiscalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Exportar para o contador</h1>
      <p className="mt-1 text-sm text-stone-600">
        Gere o arquivo de conferência por competência ou caixa. A exportação inclui pagamentos, estornos e situação fiscal.
      </p>

      <form action="/api/restaurante/export-vendas" method="get" className="mt-6 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-stone-600">Critério do relatório</label>
          <select name="criterio" defaultValue="competencia" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm">
            <option value="competencia">Competência — data da entrega</option>
            <option value="caixa">Caixa — data do pagamento</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600">Data inicial</label>
          <input type="date" name="from" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600">Data final</label>
          <input type="date" name="to" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white sm:col-span-2">
          Baixar arquivo CSV
        </button>
      </form>
    </div>
  );
}
