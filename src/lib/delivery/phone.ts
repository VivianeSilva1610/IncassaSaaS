/** Normaliza um telefone brasileiro para um link wa.me, assumindo 55 se faltar o DDI. */
export function normalizePhoneForWhatsappBr(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}
