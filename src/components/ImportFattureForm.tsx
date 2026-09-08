"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseFattureCsv, type ParseFattureCsvResult } from "@/lib/csv-parser";
import { readSpreadsheetAsCsv } from "@/lib/spreadsheet";
import { importFatture, type ImportFattureResult } from "@/app/app/actions";
import { formatEuro } from "@/lib/urgency";
import type { Locale } from "@/lib/locale";

const strings = {
  it: {
    importate: (n: number) => `${n} fatture importate`,
    nuoviClienti: (n: number) => ` (${n} nuovi clienti creati)`,
    righeIgnorate: (n: number) => `${n} righe ignorate:`,
    riga: "Riga",
    importaAltroFile: "Importa un altro file",
    righeValide: (v: number, e: number) => `${v} righe valide, ${e} righe con errori.`,
    cliente: "Cliente",
    importo: "Importo",
    scadenza: "Scadenza",
    righeVerrannoIgnorate: "Righe che verranno ignorate:",
    importazione: "Importazione…",
    importaN: (n: number) => `Importa ${n} fatture`,
    annulla: "Annulla",
  },
  en: {
    importate: (n: number) => `${n} invoices imported`,
    nuoviClienti: (n: number) => ` (${n} new clients created)`,
    righeIgnorate: (n: number) => `${n} rows skipped:`,
    riga: "Row",
    importaAltroFile: "Import another file",
    righeValide: (v: number, e: number) => `${v} valid rows, ${e} rows with errors.`,
    cliente: "Client",
    importo: "Amount",
    scadenza: "Due date",
    righeVerrannoIgnorate: "Rows that will be skipped:",
    importazione: "Importing…",
    importaN: (n: number) => `Import ${n} invoices`,
    annulla: "Cancel",
  },
};

export function ImportFattureForm({ locale = "it" }: { locale?: Locale }) {
  const t = strings[locale];
  const router = useRouter();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParseFattureCsvResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportFattureResult | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readSpreadsheetAsCsv(file);
    setCsvText(text);
    setPreview(parseFattureCsv(text));
    setResult(null);
  }

  async function handleConfirm() {
    if (!csvText) return;
    setImporting(true);
    try {
      const res = await importFatture(csvText);
      setResult(res);
      setPreview(null);
      setCsvText(null);
      router.refresh();
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setCsvText(null);
    setPreview(null);
    setResult(null);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="font-medium text-stone-900">
          ✅ {t.importate(result.imported)}
          {result.clientiCreati > 0 ? t.nuoviClienti(result.clientiCreati) : ""}
        </p>
        {result.errors.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-red-700">{t.righeIgnorate(result.errors.length)}</p>
            <ul className="mt-1 space-y-1 text-sm text-red-600">
              {result.errors.map((e, i) => (
                <li key={i}>
                  {t.riga} {e.line}: {e.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={handleReset}
          className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          {t.importaAltroFile}
        </button>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFile}
          className="mx-auto block text-sm"
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-600">{t.righeValide(preview.rows.length, preview.errors.length)}</p>

      {preview.rows.length > 0 && (
        <div className="mt-4 max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-500">
                <th className="py-1 pr-2">{t.cliente}</th>
                <th className="py-1 pr-2">{t.importo}</th>
                <th className="py-1 pr-2">{t.scadenza}</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.line} className="border-t border-stone-100">
                  <td className="py-1 pr-2">{row.cliente}</td>
                  <td className="py-1 pr-2">{formatEuro(row.importo)}</td>
                  <td className="py-1 pr-2">{row.data_scadenza}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {preview.errors.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-red-700">{t.righeVerrannoIgnorate}</p>
          <ul className="mt-1 space-y-1 text-sm text-red-600">
            {preview.errors.map((e, i) => (
              <li key={i}>
                {t.riga} {e.line}: {e.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={importing || preview.rows.length === 0}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
        >
          {importing ? t.importazione : t.importaN(preview.rows.length)}
        </button>
        <button
          onClick={handleReset}
          disabled={importing}
          className="rounded-md bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300"
        >
          {t.annulla}
        </button>
      </div>
    </div>
  );
}
