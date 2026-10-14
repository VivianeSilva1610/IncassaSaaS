import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase em memória, só o suficiente pros fluxos fiscais: from().select/
// insert/update com eq/neq/in e maybeSingle/single. Não interpreta a lista
// de colunas do select — devolve a linha inteira, inclusive objetos
// aninhados já gravados no seed (ex.: del_order_items dentro do pedido).

type Linha = Record<string, unknown>;
type Filtro = (linha: Linha) => boolean;

export type Escrita = { tabela: string; tipo: "insert" | "update"; dados: Linha };

export function criarSupabaseFalso(seed: Record<string, Linha[]>) {
  const tabelas: Record<string, Linha[]> = structuredClone(seed);
  const escritas: Escrita[] = [];
  let sequencia = 0;

  function from(tabela: string) {
    let modo: "select" | "insert" | "update" = "select";
    let payload: Linha | Linha[] | null = null;
    const filtros: Filtro[] = [];

    const executar = (): { data: Linha[]; error: null } => {
      const linhas = (tabelas[tabela] ??= []);
      if (modo === "insert") {
        const novas = (Array.isArray(payload) ? payload : [payload as Linha]).map((l) => ({ id: `${tabela}-${++sequencia}`, ...l }));
        linhas.push(...novas);
        novas.forEach((n) => escritas.push({ tabela, tipo: "insert", dados: structuredClone(n) }));
        return { data: structuredClone(novas), error: null };
      }
      const alvo = linhas.filter((l) => filtros.every((f) => f(l)));
      if (modo === "update") {
        for (const l of alvo) Object.assign(l, payload);
        escritas.push({ tabela, tipo: "update", dados: structuredClone(payload as Linha) });
      }
      return { data: structuredClone(alvo), error: null };
    };

    const builder = {
      select: () => builder,
      insert: (dados: Linha | Linha[]) => ((modo = "insert"), (payload = dados), builder),
      update: (dados: Linha) => ((modo = "update"), (payload = dados), builder),
      eq: (coluna: string, valor: unknown) => (filtros.push((l) => l[coluna] === valor), builder),
      neq: (coluna: string, valor: unknown) => (filtros.push((l) => l[coluna] !== valor), builder),
      in: (coluna: string, valores: unknown[]) => (filtros.push((l) => valores.includes(l[coluna])), builder),
      maybeSingle: async () => ({ data: executar().data[0] ?? null, error: null }),
      single: async () => {
        const linha = executar().data[0];
        return linha ? { data: linha, error: null } : { data: null, error: { message: "nenhuma linha" } };
      },
      then: (ok: (r: { data: Linha[]; error: null }) => unknown, falha?: (e: unknown) => unknown) =>
        Promise.resolve().then(executar).then(ok, falha),
    };
    return builder;
  }

  return {
    cliente: { from } as unknown as SupabaseClient,
    tabelas,
    escritas,
  };
}
