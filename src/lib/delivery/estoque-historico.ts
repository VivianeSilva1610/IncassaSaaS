export type Periodo = { label: string; boundaryMs: number };

type Movimento = { ingredient_id: string; tipo: "entrada" | "saida" | "ajuste"; quantidade: number | string; created_at: string };
type Ingrediente = { id: string; codigo: string; nome: string; ncm?: string | null; unidade: string; quantidade_atual: number | string };
type CustoHistorico = { ingredient_id: string; custo_unitario: number | string; vigente_desde: string };

// Mesma convenção de fuso usada no resto do projeto (offset fixo -03:00 —
// não há import de timezone IANA nas dependências atuais).
function fimDoMesSP(ano: number, mes: number): number {
  const proxMes = mes === 12 ? 1 : mes + 1;
  const proxAno = mes === 12 ? ano + 1 : ano;
  return new Date(`${proxAno}-${String(proxMes).padStart(2, "0")}-01T00:00:00-03:00`).getTime() - 1;
}

function fimDoAnoSP(ano: number): number {
  return new Date(`${ano + 1}-01-01T00:00:00-03:00`).getTime() - 1;
}

/** Um período por mês, de `de` até `ate` (inclusive), formato "YYYY-MM". Períodos no futuro ficam limitados a "agora". */
export function gerarPeriodosMensal(de: string, ate: string): Periodo[] {
  const [anoDeStr, mesDeStr] = de.split("-");
  const [anoAteStr, mesAteStr] = ate.split("-");
  let ano = Number(anoDeStr);
  let mes = Number(mesDeStr);
  const anoAte = Number(anoAteStr);
  const mesAte = Number(mesAteStr);
  const agora = Date.now();

  const periodos: Periodo[] = [];
  let guarda = 0;
  while ((ano < anoAte || (ano === anoAte && mes <= mesAte)) && guarda < 600) {
    periodos.push({ label: `${String(mes).padStart(2, "0")}/${ano}`, boundaryMs: Math.min(fimDoMesSP(ano, mes), agora) });
    mes++;
    if (mes > 12) {
      mes = 1;
      ano++;
    }
    guarda++;
  }
  return periodos;
}

/** Um único período cobrindo o ano inteiro (limitado a "agora" se for o ano corrente). */
export function gerarPeriodoAnual(ano: number): Periodo[] {
  return [{ label: String(ano), boundaryMs: Math.min(fimDoAnoSP(ano), Date.now()) }];
}

export type LinhaFechamentoEstoque = {
  periodo: string;
  codigo: string;
  nome: string;
  ncm: string | null;
  unidade: string;
  quantidadeFinal: number;
  entradas: number;
  saidas: number;
  ajustes: number;
  custoUnitarioNoPeriodo: number | null;
  valorEmEstoqueNoPeriodo: number | null;
};

/** Custo vigente numa data: a entrada de histórico mais recente com vigente_desde <= boundary. null se não houver nenhuma (período anterior ao início do histórico de custos). */
function custoVigenteEm(historicoDesc: CustoHistorico[], boundaryMs: number): number | null {
  for (const h of historicoDesc) {
    if (new Date(h.vigente_desde).getTime() <= boundaryMs) return Number(h.custo_unitario);
  }
  return null;
}

/**
 * Reconstrói a quantidade final de cada ingrediente ao fim de cada período,
 * "desfazendo" os movimentos mais recentes a partir do saldo atual até
 * alcançar o corte de cada período (não há snapshot histórico salvo —
 * reconstruído a partir de del_stock_movements). O custo usado é o
 * vigente naquela data (del_ingredient_custos), não o custo atual — se
 * não houver histórico de custo antes do período, o custo fica
 * desconhecido (null), honestamente, em vez de usar o custo de hoje.
 */
export function calcularFechamentosEstoque(
  ingredientes: Ingrediente[],
  movimentos: Movimento[],
  custosHistoricos: CustoHistorico[],
  periodosAsc: Periodo[],
): LinhaFechamentoEstoque[] {
  const movsPorIngrediente = new Map<string, Movimento[]>();
  for (const m of movimentos) {
    const lista = movsPorIngrediente.get(m.ingredient_id) ?? [];
    lista.push(m);
    movsPorIngrediente.set(m.ingredient_id, lista);
  }

  const custosPorIngrediente = new Map<string, CustoHistorico[]>();
  for (const c of custosHistoricos) {
    const lista = custosPorIngrediente.get(c.ingredient_id) ?? [];
    lista.push(c);
    custosPorIngrediente.set(c.ingredient_id, lista);
  }
  for (const lista of custosPorIngrediente.values()) {
    lista.sort((a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime());
  }

  const linhas: LinhaFechamentoEstoque[] = [];

  for (const ing of ingredientes) {
    const movs = (movsPorIngrediente.get(ing.id) ?? [])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const historicoCusto = custosPorIngrediente.get(ing.id) ?? [];

    let saldo = Number(ing.quantidade_atual);
    const saldoPorBoundary = new Map<number, number>();
    let idx = 0;
    for (let i = periodosAsc.length - 1; i >= 0; i--) {
      const periodo = periodosAsc[i];
      while (idx < movs.length && new Date(movs[idx].created_at).getTime() > periodo.boundaryMs) {
        const quantidade = Number(movs[idx].quantidade);
        const delta = movs[idx].tipo === "saida" ? -quantidade : quantidade;
        saldo -= delta;
        idx++;
      }
      saldoPorBoundary.set(periodo.boundaryMs, saldo);
    }

    for (let i = 0; i < periodosAsc.length; i++) {
      const periodo = periodosAsc[i];
      const boundaryAnterior = i > 0 ? periodosAsc[i - 1].boundaryMs : -Infinity;
      let entradas = 0;
      let saidas = 0;
      let ajustes = 0;
      for (const m of movs) {
        const t = new Date(m.created_at).getTime();
        if (t > boundaryAnterior && t <= periodo.boundaryMs) {
          const quantidade = Number(m.quantidade);
          if (m.tipo === "entrada") entradas += quantidade;
          else if (m.tipo === "saida") saidas += quantidade;
          else ajustes += quantidade;
        }
      }

      const quantidadeFinal = saldoPorBoundary.get(periodo.boundaryMs)!;
      const custoNoPeriodo = custoVigenteEm(historicoCusto, periodo.boundaryMs);
      linhas.push({
        periodo: periodo.label,
        codigo: ing.codigo,
        nome: ing.nome,
        ncm: ing.ncm ?? null,
        unidade: ing.unidade,
        quantidadeFinal,
        entradas,
        saidas,
        ajustes,
        custoUnitarioNoPeriodo: custoNoPeriodo,
        valorEmEstoqueNoPeriodo: custoNoPeriodo != null ? quantidadeFinal * custoNoPeriodo : null,
      });
    }
  }

  return linhas;
}
