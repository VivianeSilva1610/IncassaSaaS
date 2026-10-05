import type { SupabaseClient } from "@supabase/supabase-js";

// Bridges a restaurant order marked "a prazo" into an INCASSA invoice, so
// Viviane can collect later through the existing Fatture/sollecito flow.
// Only called when the acting user is the restaurant owner — INCASSA's
// clients/invoices tables are RLS'd by user_id = auth.uid(), which a staff
// member's own session can't satisfy on the owner's behalf.
export async function gerarFaturaParaPedido(
  supabase: SupabaseClient,
  params: {
    userId: string;
    clienteNome: string;
    clienteTelefone: string | null;
    importo: number;
    orderId: string;
  },
) {
  const { data: clienteExistente } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", params.userId)
    .eq("nome", params.clienteNome)
    .maybeSingle();

  let clientId: string;
  if (clienteExistente) {
    clientId = clienteExistente.id;
  } else {
    const { data: novoCliente, error: clienteError } = await supabase
      .from("clients")
      .insert({
        user_id: params.userId,
        nome: params.clienteNome,
        telefono: params.clienteTelefone,
        tipo: "privato",
      })
      .select("id")
      .single();

    if (clienteError || !novoCliente) {
      throw new Error("Não foi possível criar o cliente no INCASSA.");
    }
    clientId = novoCliente.id;
  }

  const dataScadenza = new Date();
  dataScadenza.setDate(dataScadenza.getDate() + 7);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: params.userId,
      client_id: clientId,
      descrizione: "Pedido do restaurante (a prazo)",
      importo: params.importo,
      data_scadenza: dataScadenza.toISOString().slice(0, 10),
      status: "aperta",
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    throw new Error("Não foi possível criar a fatura no INCASSA.");
  }

  await supabase.from("del_orders").update({ invoice_id: invoice.id }).eq("id", params.orderId);

  return invoice.id as string;
}
