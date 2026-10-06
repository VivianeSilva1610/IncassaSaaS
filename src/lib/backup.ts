import type { SupabaseClient } from "@supabase/supabase-js";

// Teto por tabela — só pra evitar que a function estoure memória se algum
// dia uma tabela crescer demais; loga um aviso em vez de falhar calado.
const LIMITE_LINHAS_POR_TABELA = 50_000;

export async function gerarBackupCompleto(supabase: SupabaseClient): Promise<{
  geradoEm: string;
  tabelas: Record<string, unknown[]>;
  avisos: string[];
}> {
  const { data: nomesTabelas, error: listError } = await supabase.rpc("listar_tabelas_backup");
  if (listError || !nomesTabelas) {
    throw new Error(`Não foi possível listar as tabelas: ${listError?.message ?? "resultado vazio"}`);
  }

  const tabelas: Record<string, unknown[]> = {};
  const avisos: string[] = [];

  for (const nome of nomesTabelas as string[]) {
    const { data, error } = await supabase.from(nome).select("*").limit(LIMITE_LINHAS_POR_TABELA);
    if (error) {
      avisos.push(`${nome}: não foi possível exportar (${error.message})`);
      continue;
    }
    tabelas[nome] = data ?? [];
    if ((data?.length ?? 0) >= LIMITE_LINHAS_POR_TABELA) {
      avisos.push(`${nome}: atingiu o limite de ${LIMITE_LINHAS_POR_TABELA} linhas, backup pode estar incompleto`);
    }
  }

  return { geradoEm: new Date().toISOString(), tabelas, avisos };
}
