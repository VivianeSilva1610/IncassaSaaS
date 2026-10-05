export function calculateProductCost(params: {
  ingredientes: { quantidade_necessaria: number; custo_unitario: number | null }[];
  totalCustosFixos: number;
  volumeMensalEstimado: number;
  margemDesejada: number;
}) {
  const custoVariavel = params.ingredientes.reduce(
    (sum, i) => sum + i.quantidade_necessaria * (i.custo_unitario ?? 0),
    0,
  );
  const custoFixoRateado =
    params.volumeMensalEstimado > 0 ? params.totalCustosFixos / params.volumeMensalEstimado : 0;
  const custoTotal = custoVariavel + custoFixoRateado;
  const precoSugerido = params.margemDesejada < 1 ? custoTotal / (1 - params.margemDesejada) : custoTotal;

  return { custoVariavel, custoFixoRateado, custoTotal, precoSugerido };
}
