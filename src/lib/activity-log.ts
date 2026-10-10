import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Registra "quem fez o quê" — chamado depois que a ação principal já deu
 * certo. Nunca lança erro: um problema aqui não pode derrubar a ação real
 * (ex: produto salvo com sucesso, mas o log falhou por algum motivo) — só
 * registra no console do servidor pra não passar despercebido.
 */
export async function registrarAtividade(
  supabase: SupabaseClient,
  params: {
    ownerId: string;
    atorEmail: string | null | undefined;
    atorNome?: string | null;
    acao: string;
    entidade?: string;
    entidadeId?: string | null;
    detalhe?: string | null;
  },
) {
  const { error } = await supabase.from("restaurant_activity_log").insert({
    owner_id: params.ownerId,
    ator_email: params.atorEmail ?? "desconhecido",
    ator_nome: params.atorNome ?? null,
    acao: params.acao,
    entidade: params.entidade ?? null,
    entidade_id: params.entidadeId ?? null,
    detalhe: params.detalhe ?? null,
  });
  if (error) console.error("[registrarAtividade] falhou:", error.message, params);
}
