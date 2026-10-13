const discreteUnits = new Set([
  "UN", "UND", "UNID", "UNIDADE", "PC", "PÇ", "PCA", "PECA", "PEÇA",
  "CX", "CAIXA", "KIT", "PAR", "PCT", "PACOTE", "DZ", "DUZIA", "DÚZIA",
]);

function normalizedUnit(unit: string) {
  return unit.trim().toLocaleUpperCase("pt-BR");
}

export function isDiscreteCommerceUnit(unit: string) {
  return discreteUnits.has(normalizedUnit(unit));
}

export function commerceQuantityStep(unit: string) {
  return isDiscreteCommerceUnit(unit) ? 1 : 0.0001;
}

export function normalizeCommerceQuantity(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

export function isValidCommerceQuantity(value: number, unit: string) {
  if (!Number.isFinite(value) || value <= 0) return false;
  return !isDiscreteCommerceUnit(unit) || Number.isInteger(value);
}

export function formatCommerceQuantity(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 }).format(value);
}
