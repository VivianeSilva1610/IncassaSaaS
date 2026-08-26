export type Urgency = "rosso" | "arancione" | "giallo" | "verde";

export function getUrgency(dataScadenza: string): Urgency {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scadenza = new Date(dataScadenza);
  scadenza.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - scadenza.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 14) return "rosso";
  if (diffDays >= 1) return "arancione";
  if (diffDays >= -1) return "giallo";
  return "verde";
}

export const urgencyEmoji: Record<Urgency, string> = {
  rosso: "🔴",
  arancione: "🟠",
  giallo: "🟡",
  verde: "🟢",
};

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}
