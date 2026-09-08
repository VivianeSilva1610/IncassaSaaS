const strings = {
  it: {
    urlLabel: "incassa.eu/app",
    daRecuperare: "DA RECUPERARE",
    daIncassare: "Da incassare",
    preventivi: "Preventivi",
    saldoNetto: "Saldo netto stimato (dopo le uscite)",
    saldoDettaglio: "€2.450,00 da recuperare − €350,00 di uscite che hai segnato",
    scadenzeOggi: "Scadenze oggi",
    usciteOggi: "Uscite oggi",
    tassoRecupero: "Tasso di recupero (30gg)",
    fattureAperte: "Fatture aperte",
    scade: "scade",
    sollecita: "Sollecita",
    row1: { nome: "Mario Rossi", importo: "€450,00", data: "15/09" },
    row2: { nome: "Studio Bianchi Srl", importo: "€1.400,00", data: "20/09" },
  },
  en: {
    urlLabel: "incassa.eu/app",
    daRecuperare: "TO COLLECT",
    daIncassare: "Invoices",
    preventivi: "Quotes",
    saldoNetto: "Estimated net balance (after expenses)",
    saldoDettaglio: "€2,450.00 to collect − €350.00 in expenses you've logged",
    scadenzeOggi: "Due today",
    usciteOggi: "Expenses today",
    tassoRecupero: "Recovery rate (30d)",
    fattureAperte: "Open invoices",
    scade: "due",
    sollecita: "Follow up",
    row1: { nome: "Mario Rossi", importo: "€450.00", data: "09/15" },
    row2: { nome: "Studio Bianchi Srl", importo: "€1,400.00", data: "09/20" },
  },
};

export function DemoDashboard({ locale = "it" }: { locale?: "it" | "en" }) {
  const t = strings[locale];

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 shadow-lg">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-100 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-xs text-stone-400">{t.urlLabel}</span>
      </div>

      {/* Dashboard content */}
      <div className="bg-stone-50 p-4 sm:p-6">
        <div className="rounded-xl bg-gradient-to-b from-stone-900 to-stone-800 p-4 text-center text-white sm:p-6">
          <p className="text-xs text-stone-300">{t.daRecuperare}</p>
          <p className="mt-1 text-2xl font-bold sm:text-3xl">€2.450,00</p>
          <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-stone-300">{t.daIncassare}</p>
              <p className="font-semibold">€1.850,00</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-stone-300">{t.preventivi}</p>
              <p className="font-semibold">€600,00</p>
            </div>
          </div>
          <div className="mx-auto mt-4 max-w-xs border-t border-white/10 pt-4">
            <p className="text-xs text-stone-300">{t.saldoNetto}</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">€2.100,00</p>
            <p className="mt-1 text-[10px] text-stone-400">{t.saldoDettaglio}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border border-stone-200 bg-white p-2.5 sm:p-3">
            <p className="text-[10px] text-stone-500 sm:text-xs">{t.scadenzeOggi}</p>
            <p className="mt-0.5 text-lg font-bold text-stone-900 sm:text-xl">2</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-2.5 sm:p-3">
            <p className="text-[10px] text-stone-500 sm:text-xs">{t.usciteOggi}</p>
            <p className="mt-0.5 text-lg font-bold text-stone-900 sm:text-xl">1</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-2.5 sm:p-3">
            <p className="text-[10px] text-stone-500 sm:text-xs">{t.tassoRecupero}</p>
            <p className="mt-0.5 text-lg font-bold text-stone-900 sm:text-xl">78%</p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-stone-900">{t.fattureAperte}</h3>
          <div className="mt-2 space-y-1.5">
            {[t.row1, t.row2].map((row) => (
              <div
                key={row.nome}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-xs font-medium text-stone-900 sm:text-sm">🟠 {row.nome}</p>
                  <p className="text-[10px] text-stone-500 sm:text-xs">
                    {row.importo} · {t.scade} {row.data}
                  </p>
                </div>
                <span className="rounded-md bg-stone-900 px-2 py-1 text-[10px] font-medium text-white sm:text-xs">
                  {t.sollecita}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
