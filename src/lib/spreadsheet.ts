import * as XLSX from "xlsx";

const EXCEL_EXTENSIONS = [".xlsx", ".xls"];

/** Legge un file caricato dall'utente (CSV o Excel) e lo restituisce come testo CSV. */
export async function readSpreadsheetAsCsv(file: File): Promise<string> {
  const isExcel = EXCEL_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (!isExcel) {
    return file.text();
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_csv(sheet);
}
