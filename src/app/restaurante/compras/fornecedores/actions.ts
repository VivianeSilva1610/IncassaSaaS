"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRestaurantSubscription } from "@/lib/subscription";

const DESTINOS_VALIDOS = ["/restaurante/compras/orcamentos", "/restaurante/compras/pedidos"];

function destinoSeguro(valor: string | null): string {
  return valor && DESTINOS_VALIDOS.includes(valor) ? valor : "/restaurante/compras/pedidos";
}

// Cadastro manual de fornecedor — necessário pra Orçamentos/Pedidos
// funcionarem sem depender de importação de NF-e (que só existe pro
// Brasil). Mesma tabela del_fornecedores usada pela importação de XML,
// mesma chave de upsert (owner_id, documento): um fornecedor cadastrado
// manualmente aqui também aparece nas duas telas.
export async function cadastrarFornecedorManual(formData: FormData) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("compras");
  const voltar = destinoSeguro(String(formData.get("voltar") ?? ""));
  if (!isGerente) redirect(`${voltar}?erro=${encodeURIComponent("Apenas o dono ou um gerente pode cadastrar fornecedor.")}`);

  const documento = String(formData.get("documento") ?? "").trim().slice(0, 40);
  const razaoSocial = String(formData.get("razao_social") ?? "").trim().slice(0, 200);
  const nomeFantasia = String(formData.get("nome_fantasia") ?? "").trim().slice(0, 200) || null;
  if (!documento || !razaoSocial) redirect(`${voltar}?erro=${encodeURIComponent("Informe o documento e a razão social do fornecedor.")}`);

  const { error } = await supabase.from("del_fornecedores").upsert(
    { owner_id: restaurantOwnerId, documento, razao_social: razaoSocial, nome_fantasia: nomeFantasia, updated_at: new Date().toISOString() },
    { onConflict: "owner_id,documento" },
  );
  if (error) redirect(`${voltar}?erro=${encodeURIComponent("Não foi possível cadastrar o fornecedor — confira se o documento já está em uso.")}`);

  revalidatePath("/restaurante/compras/orcamentos");
  revalidatePath("/restaurante/compras/pedidos");
  revalidatePath("/restaurante/compras/nfe/fornecedores");
  redirect(`${voltar}?sucesso=${encodeURIComponent("Fornecedor cadastrado.")}`);
}
