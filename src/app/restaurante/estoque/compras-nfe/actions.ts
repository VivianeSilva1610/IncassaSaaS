"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRestaurantSubscription } from "@/lib/subscription";
import { parseNfeEntrada } from "@/lib/fiscal/nfe-entrada";

const MAX_XML_BYTES = 5 * 1024 * 1024;

function comprasUrl(kind: "sucesso" | "erro", message: string) {
  return `/restaurante/estoque/compras-nfe?${kind}=${encodeURIComponent(message)}`;
}

export async function importarNfeFornecedor(formData: FormData) {
  const { user, supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("estoque");
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

  if (parsed.parcelas.length > 0) {
    const { error: parcelasError } = await supabase.from("del_notas_entrada_parcelas").insert(
      parsed.parcelas.map((parcela) => ({
        nota_entrada_id: note.id,
        owner_id: restaurantOwnerId,
        numero: parcela.numero,
        vencimento: parcela.vencimento,
        valor: parcela.valor,
      })),
    );
    if (parcelasError) {
      await supabase.from("del_notas_entrada").delete().eq("id", note.id);
      redirect(comprasUrl("erro", "A nota foi lida, mas suas parcelas não puderam ser registradas."));
    }
  }

  revalidatePath("/restaurante/estoque/compras-nfe");
  redirect(`/restaurante/estoque/compras-nfe/${note.id}?sucesso=${encodeURIComponent("NF-e importada para conferência.")}`);
}

export async function processarCompra(notaId: string, formData: FormData) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("estoque");
  if (!isGerente) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Apenas o dono ou um gerente pode confirmar a compra.")}`);

  const { data: nota } = await supabase
    .from("del_notas_entrada")
    .select("id, status")
    .eq("id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  if (!nota) redirect(comprasUrl("erro", "Nota de entrada não encontrada."));
  if (nota.status === "processada") redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Esta compra já foi processada.")}`);

  const { data: itens } = await supabase
    .from("del_notas_entrada_itens")
    .select("id")
    .eq("nota_entrada_id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .order("numero_item");
  if (!itens?.length) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("A nota não possui itens.")}`);

  const destinosPermitidos = new Set([
    "insumo_producao",
    "embalagem",
    "mercadoria_revenda",
    "uso_consumo",
    "ativo_imobilizado",
    "despesa",
  ]);
  const destinosComEstoque = new Set(["insumo_producao", "embalagem", "mercadoria_revenda"]);
  const mapeamentos = itens.map((item) => {
    const destinacao = String(formData.get(`destinacao_${item.id}`) ?? "");
    return {
      item_id: item.id,
      destinacao,
      ingrediente_id: String(formData.get(`ingrediente_${item.id}`) ?? ""),
      quantidade_estoque: Number(formData.get(`quantidade_${item.id}`) ?? 0),
    };
  });
  if (mapeamentos.some((item) => !destinosPermitidos.has(item.destinacao))) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Classifique a destinação de todos os itens.")}`);
  }
  if (mapeamentos.some((item) => destinosComEstoque.has(item.destinacao) && (!/^[0-9a-f-]{36}$/i.test(item.ingrediente_id) || !Number.isFinite(item.quantidade_estoque) || item.quantidade_estoque <= 0))) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Itens com controle de estoque precisam de vínculo e quantidade válida.")}`);
  }

  const gerarConta = formData.get("gerar_conta") === "on";
  const vencimento = String(formData.get("vencimento") ?? "");
  const { count: quantidadeParcelas } = gerarConta
    ? await supabase
        .from("del_notas_entrada_parcelas")
        .select("id", { count: "exact", head: true })
        .eq("nota_entrada_id", notaId)
        .eq("owner_id", restaurantOwnerId)
    : { count: 0 };
  if (gerarConta && !quantidadeParcelas && !/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Informe o vencimento da conta a pagar.")}`);
  }

  const { error } = await supabase.rpc("del_processar_nota_entrada", {
    p_nota_id: notaId,
    p_mapeamentos: mapeamentos,
    p_gerar_conta: gerarConta,
    p_vencimento: gerarConta && !quantidadeParcelas ? vencimento : null,
  });
  if (error) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent(`Não foi possível processar: ${error.message}`)}`);

  revalidatePath("/restaurante/estoque/compras-nfe");
  revalidatePath(`/restaurante/estoque/compras-nfe/${notaId}`);
  revalidatePath("/restaurante/estoque");
  revalidatePath("/restaurante/financeiro/contas-a-pagar");
  redirect(`/restaurante/estoque/compras-nfe/${notaId}?sucesso=${encodeURIComponent("Compra classificada e processada com sucesso.")}`);
}

export async function excluirNotaEntrada(notaId: string) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("estoque");
  if (!isGerente) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Apenas o dono ou um gerente pode excluir a nota.")}`);

  const { data: nota } = await supabase
    .from("del_notas_entrada")
    .select("id, status")
    .eq("id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();

  if (!nota) redirect(comprasUrl("erro", "Nota de entrada não encontrada."));
  if (!['importada', 'conferida'].includes(nota.status)) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Esta nota já afetou o estoque ou foi cancelada e não pode ser excluída. Faça um estorno.")}`);
  }

  const { error } = await supabase
    .from("del_notas_entrada")
    .delete()
    .eq("id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .in("status", ["importada", "conferida"]);
  if (error) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent(`Não foi possível excluir a nota: ${error.message}`)}`);

  revalidatePath("/restaurante/estoque/compras-nfe");
  redirect(comprasUrl("sucesso", "Nota importada excluída. Agora você pode corrigir o cadastro e importá-la novamente."));
}

export async function criarItemEstoqueNaCompra(notaId: string, formData: FormData) {
  const { supabase, restaurantOwnerId, isGerente } = await requireRestaurantSubscription("estoque");
  if (!isGerente) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Apenas o dono ou um gerente pode cadastrar itens de estoque.")}`);

  const { data: nota } = await supabase
    .from("del_notas_entrada")
    .select("id, status")
    .eq("id", notaId)
    .eq("owner_id", restaurantOwnerId)
    .maybeSingle();
  if (!nota || !["importada", "conferida"].includes(nota.status)) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Esta compra não permite novos cadastros de estoque.")}`);
  }

  const notaItemId = String(formData.get("nota_item_id") ?? "");
  const { data: notaItem } = notaItemId
    ? await supabase
        .from("del_notas_entrada_itens")
        .select("id, descricao, ncm")
        .eq("id", notaItemId)
        .eq("nota_entrada_id", notaId)
        .eq("owner_id", restaurantOwnerId)
        .maybeSingle()
    : { data: null };

  const nomeInformado = String(formData.get("nome") ?? "").trim();
  const nome = nomeInformado || String(notaItem?.descricao ?? "").trim();
  const unidade = String(formData.get("unidade") ?? "").trim().toLowerCase();
  const ncmInformado = String(formData.get("ncm") ?? "").replace(/\D/g, "");
  const ncmXml = String(notaItem?.ncm ?? "").replace(/\D/g, "");
  const ncm = ncmInformado || ncmXml || null;
  if (ncm && !/^\d{8}$/.test(ncm)) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("O NCM deve conter 8 dígitos.")}`);
  }
  const estoqueMinimoRaw = String(formData.get("estoque_minimo") ?? "").trim();
  const estoqueMinimo = estoqueMinimoRaw ? Number(estoqueMinimoRaw) : null;
  const unidadesPermitidas = new Set(["kg", "g", "l", "ml", "un", "cx", "pct"]);
  if (nome.length < 2 || nome.length > 120 || !unidadesPermitidas.has(unidade)) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Informe um nome e uma unidade de estoque válidos.")}`);
  }
  if (estoqueMinimo !== null && (!Number.isFinite(estoqueMinimo) || estoqueMinimo < 0)) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("O estoque mínimo não é válido.")}`);
  }

  const { data: existente } = await supabase
    .from("del_ingredients")
    .select("id")
    .eq("owner_id", restaurantOwnerId)
    .ilike("nome", nome)
    .limit(1)
    .maybeSingle();
  if (existente) {
    redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent("Já existe um item de estoque com esse nome. Selecione-o na lista.")}`);
  }

  const { data: ultimo } = await supabase
    .from("del_ingredients")
    .select("codigo")
    .eq("owner_id", restaurantOwnerId)
    .order("codigo", { ascending: false })
    .limit(1)
    .maybeSingle();
  const codigo = String((Number.parseInt(ultimo?.codigo || "0", 10) || 0) + 1).padStart(4, "0");

  const { error } = await supabase.from("del_ingredients").insert({
    owner_id: restaurantOwnerId,
    codigo,
    nome,
    unidade,
    quantidade_atual: 0,
    estoque_minimo: estoqueMinimo,
    custo_unitario: null,
    ncm,
    ncm_origem: ncm ? (ncmInformado ? "manual" : "xml") : null,
    ncm_revisado: ncm ? formData.get("ncm_revisado") === "on" : false,
  });
  if (error) redirect(`/restaurante/estoque/compras-nfe/${notaId}?erro=${encodeURIComponent(`Não foi possível cadastrar o item: ${error.message}`)}`);

  revalidatePath(`/restaurante/estoque/compras-nfe/${notaId}`);
  revalidatePath("/restaurante/estoque");
  redirect(`/restaurante/estoque/compras-nfe/${notaId}?sucesso=${encodeURIComponent(`${nome} foi cadastrado com saldo zero. Agora selecione-o no item da nota.`)}`);
}
