/** Normaliza um telefone pro formato de link wa.me, assumindo o DDI do país do restaurante se faltar. */
export function normalizePhoneForWhatsapp(raw: string, country: "BR" | "IT" = "BR"): string {
  const ddi = country === "IT" ? "39" : "55";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith(ddi)) return digits;
  return `${ddi}${digits}`;
}
