import Papa from "papaparse";

export interface ParsedFatturaRow {
  line: number;
  cliente: string;
  telefono: string | null;
  email: string | null;
  importo: number;
  data_scadenza: string;
  numero: string | null;
  descrizione: string | null;
  luogo_lavoro: string | null;
}

export interface FatturaRowError {
  line: number;
  reason: string;
}

export interface ParseFattureCsvResult {
  rows: ParsedFatturaRow[];
  errors: FatturaRowError[];
}

const MAX_ROWS = 500;

function parseImporto(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseData(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, gg, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, "0")}-${gg.padStart(2, "0")}`;
  }
  return null;
}

/** Pura: nessun I/O, usabile sia nel preview client che nel commit server. */
export function parseFattureCsv(csvText: string): ParseFattureCsvResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ParsedFatturaRow[] = [];
  const errors: FatturaRowError[] = [];

  parsed.data.slice(0, MAX_ROWS).forEach((raw, index) => {
    const line = index + 2;
    const cliente = (raw.cliente ?? "").trim();
    const importoRaw = (raw.importo ?? "").trim();
    const dataRaw = (raw.data_scadenza ?? "").trim();

    if (!cliente) {
      errors.push({ line, reason: "Nome cliente mancante" });
      return;
    }

    const importo = parseImporto(importoRaw);
    if (importo === null) {
      errors.push({ line, reason: `Importo non valido: "${importoRaw}"` });
      return;
    }

    const dataScadenza = parseData(dataRaw);
    if (dataScadenza === null) {
      errors.push({ line, reason: `Data non valida: "${dataRaw}" (usa AAAA-MM-GG o GG/MM/AAAA)` });
      return;
    }

    rows.push({
      line,
      cliente,
      telefono: (raw.telefono ?? "").trim() || null,
      email: (raw.email ?? "").trim() || null,
      importo,
      data_scadenza: dataScadenza,
      numero: (raw.numero ?? "").trim() || null,
      descrizione: (raw.descrizione ?? "").trim() || null,
      luogo_lavoro: (raw.luogo_lavoro ?? "").trim() || null,
    });
  });

  return { rows, errors };
}
