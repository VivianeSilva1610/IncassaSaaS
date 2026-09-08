"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseClientiCsv, type ParseClientiCsvResult } from "@/lib/csv-parser";
import { readSpreadsheetAsCsv } from "@/lib/spreadsheet";
import { importClienti, type ImportClientiResult } from "@/app/app/actions";
import type { Locale } from "@/lib/locale";

const strings = {
  it: {
    importati: (n: number) => `${n} clienti importati`,
    giaEsistenti: (n: number) => ` (${n} già esistenti, saltati)`,
    righeIgnorate: (n: number) => `${n} righe ignorate:`,
    riga: "Riga",
    importaAltroFile: "Importa un altro file",
    righeValide: (v: number, e: number) => `${v} righe valide, ${e} righe con errori.`,
    nome: "Nome",
    tipo: "Tipo",
    telefono: "Telefono",
    email: "Email",
    righeVerrannoIgnorate: "Righe che verranno ignorate:",
    importazione: "Importazione…",
    importaN: (n: number) => `Importa ${n} clienti`,
    annulla: "Annulla",
  },
  en: {
    importati: (n: number) => `${n} clients imported`,
    giaEsistenti: (n: number) => ` (${n} already existing, skipped)`,
    righeIgnorate: (n: number) => `${n} rows skipped:`,
    riga: "Row",
    importaAltroFile: "Import another file",
    righeValide: (v: number, e: number) => `${v} valid rows, ${e} rows with errors.`,
    nome: "Name",
    tipo: "Type",
    telefono: "Phone",
    email: "Email",
    righeVerrannoIgnorate: "Rows that will be skipped:",
    importazione: "Importing…",
    importaN: (n: number) => `Import ${n} clients`,
    annulla: "Cancel",
  },
};

export function ImportClientiForm({ locale = "it" }: { locale?: Locale }) {
  const t = strings[locale];
  const router = useRouter();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParseClientiCsvResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportClientiResult | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await readSpreadsheetAsCsv(file);
    setCsvText(text);
    setPreview(parseClientiCsv(text));
    setResult(null);
  }

  async function handleConfirm() {
    if (!csvText) return;
    setImporting(true);
    try {
      const res = await importClienti(csvText);
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
          ✅ {t.importati(result.imported)}
          {result.saltati > 0 ? t.giaEsistenti(result.saltati) : ""}
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
                <th className="py-1 pr-2">{t.nome}</th>
                <th className="py-1 pr-2">{t.tipo}</th>
                <th className="py-1 pr-2">{t.telefono}</th>
                <th className="py-1 pr-2">{t.email}</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.line} className="border-t border-stone-100">
                  <td className="py-1 pr-2">{row.nome}</td>
                  <td className="py-1 pr-2">{row.tipo}</td>
                  <td className="py-1 pr-2">{row.telefono ?? "—"}</td>
                  <td className="py-1 pr-2">{row.email ?? "—"}</td>
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
