"use client";

export function PrintFiscalDocumentButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 print:hidden">
      Imprimir
    </button>
  );
}
