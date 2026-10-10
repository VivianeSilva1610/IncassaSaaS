import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getFiscalProviderIt } from "./fatturaIt";

// fiscal_documents/fiscal_documents_it/fiscal_events só têm policy de
// select pro tenant (migration 0050) — escrita é exclusiva da service
// role, por desenho (emissão real viria de um provedor/webhook, igual ao
// padrão já usado pro estorno da Asaas). As leituras usam o client comum
// (RLS já libera select pro dono/equipe do restaurante).
export async function emitirDocumentoFiscaleParaPedido(
  supabase: SupabaseClient,
  params: { ownerId: string; restaurantId: string; orderId: string },
) {
  const { data: pedido } = await supabase
    .from("del_orders")
    .select("id, totale, pago, cliente_nome")
    .eq("id", params.orderId)
    .eq("owner_id", params.ownerId)
    .maybeSingle();
  if (!pedido) throw new Error("Pedido non trovato.");
  if (!pedido.pago) throw new Error("Il documento fiscale può essere emesso solo dopo la conferma del pagamento.");

  const { data: documentoAtivo } = await supabase
    .from("fiscal_documents")
    .select("id, status")
    .eq("restaurant_id", params.restaurantId)
    .eq("order_id", params.orderId)
    .in("status", ["pendente", "emitido"])
    .maybeSingle();
  if (documentoAtivo) {
    return {
      documentoId: documentoAtivo.id as string,
      status: documentoAtivo.status as "pendente" | "emitido",
      mensagemErro: undefined,
    };
  }

  const [{ data: configIt }, { data: perfil }] = await Promise.all([
    supabase.from("restaurant_fiscal_it").select("*").eq("restaurant_id", params.restaurantId).maybeSingle(),
    supabase.from("restaurant_fiscal_profiles").select("ambiente").eq("restaurant_id", params.restaurantId).maybeSingle(),
  ]);

  const provider = getFiscalProviderIt(configIt?.provedor ?? null, configIt?.provedor_api_key ?? null);
  const resultado = await provider.emitirDocumento({
    config: {
      ragioneSociale: configIt?.ragione_sociale ?? null,
      partitaIva: configIt?.partita_iva ?? null,
      codiceFiscale: configIt?.codice_fiscale ?? null,
      ambiente: (perfil?.ambiente as "homologacao" | "producao") ?? "homologacao",
    },
    pedido: { id: pedido.id, totale: Number(pedido.totale), clienteNome: pedido.cliente_nome },
  });

  const admin = getSupabaseAdmin();
  const { data: documento, error } = await admin
    .from("fiscal_documents")
    .insert({
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      country_code: "IT",
      tipo_documento: "fattura_elettronica",
      status: resultado.status === "emitido" ? "emitido" : "erro",
      valuta: "EUR",
      totale: Number(pedido.totale),
    })
    .select("id")
    .single();
  if (error || !documento) throw new Error("Non è stato possibile registrare il documento fiscale.");

  await admin.from("fiscal_documents_it").insert({
    fiscal_document_id: documento.id,
    protocollo_sdi: resultado.protocolloSdi ?? null,
    esito: resultado.esito ?? (resultado.status === "erro" ? "errore" : null),
    motivo_scarto: resultado.mensagemErro ?? null,
  });

  await admin.from("fiscal_events").insert({
    fiscal_document_id: documento.id,
    tipo_evento: resultado.status === "emitido" ? "emissione" : "errore",
    detalhe: resultado,
  });

  return {
    documentoId: documento.id as string,
    status: resultado.status === "emitido" ? ("emitido" as const) : ("erro" as const),
    mensagemErro: resultado.mensagemErro,
  };
}

export async function cancelarDocumentoFiscale(
  supabase: SupabaseClient,
  params: { restaurantId: string; documentoId: string; justificativa: string },
) {
  const { data: documento } = await supabase
    .from("fiscal_documents")
    .select("id, status")
    .eq("id", params.documentoId)
    .eq("restaurant_id", params.restaurantId)
    .maybeSingle();
  if (!documento) throw new Error("Documento non trovato.");
  if (documento.status !== "emitido") throw new Error("Solo un documento emesso può essere annullato.");

  const { data: configIt } = await supabase
    .from("restaurant_fiscal_it")
    .select("provedor, provedor_api_key")
    .eq("restaurant_id", params.restaurantId)
    .maybeSingle();

  const provider = getFiscalProviderIt(configIt?.provedor ?? null, configIt?.provedor_api_key ?? null);
  const resultado = await provider.cancelarDocumento();

  const admin = getSupabaseAdmin();
  if (resultado.status === "cancelado") {
    await admin.from("fiscal_documents").update({ status: "cancelado", updated_at: new Date().toISOString() }).eq("id", documento.id);
  }
  await admin.from("fiscal_events").insert({
    fiscal_document_id: documento.id,
    tipo_evento: resultado.status === "cancelado" ? "annullamento" : "errore_annullamento",
    detalhe: { ...resultado, justificativa: params.justificativa },
  });

  if (resultado.status !== "cancelado") {
    throw new Error(resultado.mensagemErro ?? "Annullamento fiscale rifiutato.");
  }
  return resultado;
}
