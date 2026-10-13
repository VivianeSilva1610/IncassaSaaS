"use client";

export function CommercePrintButton() {
  return <button type="button" onClick={() => window.print()} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white print:hidden">Imprimir comprovante</button>;
}

