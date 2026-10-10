"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { registrarAtividade } from "@/lib/activity-log";

const baseUrl = "/restaurante/compras/solicitacoes";

function go(kind: "sucesso" | "erro", message: string): never {
  redirect(`${baseUrl}?${kind}=${encodeURIComponent(message)}`);
}

// Sem fornecedor, sem preço negociado — só produto e quantidade. O custo de
// referência é um snapshot só pra uso interno (nunca é mostrado ao
// fornecedor, nem quando a solicitação vira item de um orçamento).
export async function criarSolicitacoes(formData: FormData) {
  const { user, supabase, restaurantOwnerId } = await requireRestaurantSubscription("compras");
  const observacao = String(formData.get("observacao") ?? "").trim().slice(0, 1000) || null;

  const selecionados = [...formData.keys()]
    .filter((key) => key.startsWith("selecionar_"))
    .map((key) => key.replace("selecionar_", ""))
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (selecionados.length === 0) go("erro", "Selecione pelo menos um material.");

  const { data: ingredientes } = await supabase
    .from("del_ingredients")
    .select("id, nome, unidade, custo_unitario")
    .eq("owner_id", restaurantOwnerId)
    .in("id", selecionados);
  if (!ingredientes || ingredientes.length !== selecionados.length) go("erro", "Um dos materiais selecionados não foi encontrado.");

  const itens = ingredientes.map((ingrediente) => ({
    ingrediente,
    quantidade: Number(formData.get(`quantidade_${ingrediente.id}`) ?? 0),
  }));
  if (itens.some((item) => !Number.isFinite(item.quantidade) || item.quantidade <= 0)) {
    go("erro", "Informe uma quantidade maior que zero para todos os materiais selecionados.");
  }

  const { error } = await supabase.from("del_solicitacoes_compra").insert(
    itens.map(({ ingrediente, quantidade }) => ({
      owner_id: restaurantOwnerId,
      ingrediente_id: ingrediente.id,
      descricao_snapshot: ingrediente.nome,
      unidade_snapshot: ingrediente.unidade,
      quantidade,
      custo_referencia: ingrediente.custo_unitario,
      solicitado_por: user.id,
      solicitado_por_email: user.email,
      observacao,
    })),
  );
  if (error) go("erro", `Não foi possível registrar a solicitação: ${error.message}`);

  await registrarAtividade(supabase, {
    ownerId: restaurantOwnerId, atorEmail: user.email, acao: "solicitacao_compra_criada",
    entidade: "solicitacao_compra", detalhe: `${itens.length} ite${itens.length === 1 ? "m" : "ns"}`,
  });

  revalidatePath(baseUrl);
  go("sucesso", itens.length === 1 ? "Solicitação registrada." : `${itens.length} solicitações registradas.`);
}

export async function cancelarSolicitacao(id: string) {
  const { supabase, restaurantOwnerId, user } = await requireRestaurantSubscription("compras");
  const { error } = await supabase
    .from("del_solicitacoes_compra")
    .update({ status: "cancelada", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", restaurantOwnerId)
    .eq("status", "aberta");
  if (error) go("erro", "Não foi possível cancelar a solicitação.");

  await registrarAtividade(supabase, {
    ownerId: restaurantOwnerId, atorEmail: user.email, acao: "solicitacao_compra_cancelada", entidade: "solicitacao_compra", entidadeId: id,
  });

  revalidatePath(baseUrl);
  go("sucesso", "Solicitação cancelada.");
}
