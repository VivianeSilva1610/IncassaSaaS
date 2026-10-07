"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { parseNfeEntrada } from "@/lib/fiscal/nfe-entrada";

const MAX_XML_BYTES = 5 * 1024 * 1024;

function comprasUrl(kind: "sucesso" | "erro", message: string) {
  return `/restaurante/compras?${kind}=${encodeURIComponent(message)}`;
}

export async function importarNfeFornecedor(formData: FormData) {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription();
  if (!isGerente) redirect(comprasUrl("erro", "Apenas o dono ou um gerente pode importar compras."));

  const file = formData.get("xml");
  if (!(file instanceof File) || file.size === 0) redirect(comprasUrl("erro", "Selecione o XML da NF-e."));
  if (file.size > MAX_XML_BYTES) redirect(comprasUrl("erro", "O XML deve ter no máximo 5 MB."));
  if (!file.name.toLowerCase().endsWith(".xml")) redirect(comprasUrl("erro", "O arquivo precisa ter extensão .xml."));

  let parsed: ReturnType<typeof parseNfeEntrada>;
  let xml: string;
  try {
    xml = await file.text();
    parsed = parseNfeEntrada(xml);
  } catch (error) {
    redirect(comprasUrl("erro", error instanceof Error ? error.message : "Não foi possível ler a NF-e."));
  }

  const { data: existing } = await supabase
    .from("del_notas_entrada")
    .select("id")
    .eq("owner_id", restaurantOwnerId)
    .eq("chave_acesso", parsed.chaveAcesso)
    .maybeSingle();
  if (existing) redirect(comprasUrl("erro", "Esta NF-e já foi importada."));

  const { data: fiscal } = await supabase
    .from("del_fiscal_config")
    .select("cnpj")
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  const cnpjConfigurado = String(fiscal?.cnpj ?? "").replace(/\D/g, "");
  if (cnpjConfigurado && parsed.destinatarioDocumento && cnpjConfigurado !== parsed.destinatarioDocumento) {
    redirect(comprasUrl("erro", "O destinatário desta NF-e não é o estabelecimento configurado."));
  }

  const { data: supplier, error: supplierError } = await supabase
    .from("del_fornecedores")
    .upsert(
      {
        owner_id: restaurantOwnerId,
        documento: parsed.fornecedorDocumento,
        razao_social: parsed.fornecedorNome,
        nome_fantasia: parsed.fornecedorFantasia,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,documento" },
    )
    .select("id")
    .single();
  if (supplierError || !supplier) redirect(comprasUrl("erro", "Não foi possível cadastrar o fornecedor."));

  const { data: note, error: noteError } = await supabase
    .from("del_notas_entrada")
    .insert({
      owner_id: restaurantOwnerId,
      fornecedor_id: supplier.id,
      chave_acesso: parsed.chaveAcesso,
      numero: parsed.numero,
      serie: parsed.serie,
      emitida_em: parsed.emitidaEm,
      fornecedor_documento: parsed.fornecedorDocumento,
      fornecedor_nome: parsed.fornecedorNome,
      destinatario_documento: parsed.destinatarioDocumento,
      valor_total: parsed.valorTotal,
      protocolo_autorizacao: parsed.protocoloAutorizacao,
      xml_original: xml,
      importada_por: user.id,
    })
    .select("id")
    .single();
  if (noteError || !note) {
    const duplicate = noteError?.code === "23505";
    redirect(comprasUrl("erro", duplicate ? "Esta NF-e já foi importada." : "Não foi possível registrar a NF-e."));
  }

  const { error: itemsError } = await supabase.from("del_notas_entrada_itens").insert(
    parsed.itens.map((item) => ({
      nota_entrada_id: note.id,
      owner_id: restaurantOwnerId,
      numero_item: item.numeroItem,
      codigo_fornecedor: item.codigoFornecedor,
      ean: item.ean,
      descricao: item.descricao,
      ncm: item.ncm,
      cest: item.cest,
      cfop: item.cfop,
      unidade: item.unidade,
      quantidade: item.quantidade,
      valor_unitario: item.valorUnitario,
      valor_total: item.valorTotal,
    })),
  );
  if (itemsError) {
    await supabase.from("del_notas_entrada").delete().eq("id", note.id);
    redirect(comprasUrl("erro", "A nota foi lida, mas seus itens não puderam ser registrados."));
  }

  revalidatePath("/restaurante/compras");
  redirect(`/restaurante/compras/${note.id}?sucesso=${encodeURIComponent("NF-e importada para conferência.")}`);
}

export async function processarCompra(notaId: string, formData: FormData) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription();
  if (!isGerente) redirect(`/restaurante/compras/${notaId}?erro=${encodeURIComponent("Apenas o dono ou um gerente pode confirmar a compra.")}`);

  const { data: nota } = await supabase
    .from("del_notas_entrada")
    .select("id, status")
    .eq("id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  if (!nota) redirect(comprasUrl("erro", "Nota de entrada não encontrada."));
  if (nota.status === "processada") redirect(`/restaurante/compras/${notaId}?erro=${encodeURIComponent("Esta compra já foi processada.")}`);

  const { data: itens } = await supabase
    .from("del_notas_entrada_itens")
    .select("id")
    .eq("nota_entrada_id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .order("numero_item");
  if (!itens?.length) redirect(`/restaurante/compras/${notaId}?erro=${encodeURIComponent("A nota não possui itens.")}`);

  const mapeamentos = itens.map((item) => ({
    item_id: item.id,
    ingrediente_id: String(formData.get(`ingrediente_${item.id}`) ?? ""),
    quantidade_estoque: Number(formData.get(`quantidade_${item.id}`) ?? 0),
  }));
  if (mapeamentos.some((item) => !/^[0-9a-f-]{36}$/i.test(item.ingrediente_id) || !Number.isFinite(item.quantidade_estoque) || item.quantidade_estoque <= 0)) {
    redirect(`/restaurante/compras/${notaId}?erro=${encodeURIComponent("Vincule todos os itens e informe quantidades válidas.")}`);
  }

  const gerarConta = formData.get("gerar_conta") === "on";
  const vencimento = String(formData.get("vencimento") ?? "");
  if (gerarConta && !/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    redirect(`/restaurante/compras/${notaId}?erro=${encodeURIComponent("Informe o vencimento da conta a pagar.")}`);
  }

  const { error } = await supabase.rpc("del_processar_nota_entrada", {
    p_nota_id: notaId,
    p_mapeamentos: mapeamentos,
    p_gerar_conta: gerarConta,
    p_vencimento: gerarConta ? vencimento : null,
  });
  if (error) redirect(`/restaurante/compras/${notaId}?erro=${encodeURIComponent(`Não foi possível processar: ${error.message}`)}`);

  revalidatePath("/restaurante/compras");
  revalidatePath(`/restaurante/compras/${notaId}`);
  revalidatePath("/restaurante/estoque");
  revalidatePath("/restaurante/financeiro/contas-a-pagar");
  redirect(`/restaurante/compras/${notaId}?sucesso=${encodeURIComponent("Compra confirmada, estoque e custos atualizados.")}`);
}
