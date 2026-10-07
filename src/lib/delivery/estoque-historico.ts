export type TipoPeriodo = "mensal" | "anual";

export type Periodo = { label: string; boundaryMs: number };

type Movimento = { ingredient_id: string; tipo: "entrada" | "saida" | "ajuste"; quantidade: number | string; created_at: string };
type Ingrediente = { id: string; codigo: string; nome: string; unidade: string; quantidade_atual: number | string; custo_unitario: number | string | null };

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

/** Períodos em ordem cronológica (do mais antigo pro mais recente). O período atual usa "agora" como corte, já que o mês/ano ainda não terminou. */
export function gerarPeriodos(tipo: TipoPeriodo, quantidade: number): Periodo[] {
  const agora = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(agora);
  const anoAtual = Number(partes.find((p) => p.type === "year")!.value);
  const mesAtual = Number(partes.find((p) => p.type === "month")!.value);

  const periodos: Periodo[] = [];
  for (let i = 0; i < quantidade; i++) {
    if (tipo === "mensal") {
      let mes = mesAtual - i;
      let ano = anoAtual;
      while (mes <= 0) {
        mes += 12;
        ano -= 1;
      }
      const fim = fimDoMesSP(ano, mes);
      periodos.push({
        label: `${String(mes).padStart(2, "0")}/${ano}`,
        boundaryMs: i === 0 ? Math.min(fim, agora.getTime()) : fim,
      });
    } else {
      const ano = anoAtual - i;
      const fim = fimDoAnoSP(ano);
      periodos.push({ label: String(ano), boundaryMs: i === 0 ? Math.min(fim, agora.getTime()) : fim });
    }
  }
  return periodos.reverse();
}

export type LinhaFechamentoEstoque = {
  periodo: string;
  codigo: string;
  nome: string;
  unidade: string;
  quantidadeFinal: number;
  entradas: number;
  saidas: number;
  ajustes: number;
  custoUnitarioAtual: number | null;
  valorEmEstoqueAtual: number | null;
};

/**
 * Reconstrói a quantidade final de cada ingrediente ao fim de cada período,
 * "desfazendo" os movimentos mais recentes a partir do saldo atual até
 * alcançar o corte de cada período (não há snapshot histórico salvo —
 * reconstruído a partir de del_stock_movements).
 */
export function calcularFechamentosEstoque(
  ingredientes: Ingrediente[],
  movimentos: Movimento[],
  periodosAsc: Periodo[],
): LinhaFechamentoEstoque[] {
  const movsPorIngrediente = new Map<string, Movimento[]>();
  for (const m of movimentos) {
    const lista = movsPorIngrediente.get(m.ingredient_id) ?? [];
    lista.push(m);
    movsPorIngrediente.set(m.ingredient_id, lista);
  }

  const linhas: LinhaFechamentoEstoque[] = [];

  for (const ing of ingredientes) {
    const movs = (movsPorIngrediente.get(ing.id) ?? [])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

    const custo = ing.custo_unitario != null ? Number(ing.custo_unitario) : null;

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
      linhas.push({
        periodo: periodo.label,
        codigo: ing.codigo,
        nome: ing.nome,
        unidade: ing.unidade,
        quantidadeFinal,
        entradas,
        saidas,
        ajustes,
        custoUnitarioAtual: custo,
        valorEmEstoqueAtual: custo != null ? quantidadeFinal * custo : null,
      });
    }
  }

  return linhas;
}
