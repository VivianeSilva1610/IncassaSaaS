/** Normalizza un numero italiano per un link wa.me, assumendo +39 se manca il prefisso. */
export function normalizePhoneForWhatsapp(raw: string): string {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");

  if (hasPlus || digits.startsWith("39")) {
    return digits;
  }

  return `39${digits}`;
}
