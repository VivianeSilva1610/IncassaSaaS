"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseFattureCsv, type ParseFattureCsvResult } from "@/lib/csv-parser";
import { importFatture, type ImportFattureResult } from "@/app/app/actions";
import { formatEuro } from "@/lib/urgency";

export function ImportFattureForm() {
  const router = useRouter();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParseFattureCsvResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportFattureResult | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
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
          ✅ {result.imported} fatture importate
          {result.clientiCreati > 0 ? ` (${result.clientiCreati} nuovi clienti creati)` : ""}
        </p>
        {result.errors.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-red-700">{result.errors.length} righe ignorate:</p>
            <ul className="mt-1 space-y-1 text-sm text-red-600">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Riga {e.line}: {e.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={handleReset}
          className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Importa un altro file
        </button>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center">
        <input type="file" accept=".csv" onChange={handleFile} className="mx-auto block text-sm" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-600">
        {preview.rows.length} righe valide, {preview.errors.length} righe con errori.
      </p>

      {preview.rows.length > 0 && (
        <div className="mt-4 max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-500">
                <th className="py-1 pr-2">Cliente</th>
                <th className="py-1 pr-2">Importo</th>
                <th className="py-1 pr-2">Scadenza</th>
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
          <p className="text-sm font-medium text-red-700">Righe che verranno ignorate:</p>
          <ul className="mt-1 space-y-1 text-sm text-red-600">
            {preview.errors.map((e, i) => (
              <li key={i}>
                Riga {e.line}: {e.reason}
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
          {importing ? "Importazione…" : `Importa ${preview.rows.length} fatture`}
        </button>
        <button
          onClick={handleReset}
          disabled={importing}
          className="rounded-md bg-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-300"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
