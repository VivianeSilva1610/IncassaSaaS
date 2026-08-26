"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import {
  parseFattureCsv,
  parseClientiCsv,
  type ParsedFatturaRow,
  type ParsedClienteRow,
  type CsvRowError,
} from "@/lib/csv-parser";
import { normalizePhoneForWhatsapp } from "@/lib/phone";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function requireOwnClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    throw new Error("Cliente non valido.");
  }
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      console.error("Failed to cancel subscription during account deletion:", err);
    }
  }

  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Failed to delete user during account deletion:", error);
    throw new Error("Non siamo riusciti a eliminare l'account. Riprova o scrivici.");
  }

  redirect("/account-eliminato");
}

export async function addCliente(formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase.from("clients").insert({
    user_id: user.id,
    nome: String(formData.get("nome") ?? ""),
    telefono: String(formData.get("telefono") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    tipo: String(formData.get("tipo") ?? "privato"),
    indirizzo: String(formData.get("indirizzo") ?? "") || null,
    note: String(formData.get("note") ?? "") || null,
  });

  revalidatePath("/app/clienti");
}

export async function updateCliente(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("clients")
    .update({
      nome: String(formData.get("nome") ?? ""),
      telefono: String(formData.get("telefono") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      tipo: String(formData.get("tipo") ?? "privato"),
      indirizzo: String(formData.get("indirizzo") ?? "") || null,
      note: String(formData.get("note") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/app/clienti");
}

export async function deleteCliente(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("clients").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/clienti");
}

export async function addFattura(formData: FormData) {
  const { supabase, user } = await requireUser();
  const clientId = String(formData.get("client_id") ?? "");
  await requireOwnClient(supabase, clientId, user.id);

  await supabase.from("invoices").insert({
    user_id: user.id,
    client_id: clientId,
    numero: String(formData.get("numero") ?? "") || null,
    descrizione: String(formData.get("descrizione") ?? "") || null,
    importo: Number(formData.get("importo") ?? 0),
    data_scadenza: String(formData.get("data_scadenza") ?? ""),
    luogo_lavoro: String(formData.get("luogo_lavoro") ?? "") || null,
  });

  revalidatePath("/app/fatture");
  revalidatePath("/app");
}

export async function updateFattura(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const clientId = String(formData.get("client_id") ?? "");
  await requireOwnClient(supabase, clientId, user.id);

  await supabase
    .from("invoices")
    .update({
      client_id: clientId,
      numero: String(formData.get("numero") ?? "") || null,
      descrizione: String(formData.get("descrizione") ?? "") || null,
      importo: Number(formData.get("importo") ?? 0),
      data_scadenza: String(formData.get("data_scadenza") ?? ""),
      luogo_lavoro: String(formData.get("luogo_lavoro") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/app/fatture");
  revalidatePath("/app");
}

export async function markFatturaPagata(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("invoices").update({ status: "pagata" }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/fatture");
  revalidatePath("/app");
}

export async function deleteFattura(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/fatture");
  revalidatePath("/app");
}

export async function addPreventivo(formData: FormData) {
  const { supabase, user } = await requireUser();
  const clientId = String(formData.get("client_id") ?? "");
  await requireOwnClient(supabase, clientId, user.id);

  await supabase.from("quotes").insert({
    user_id: user.id,
    client_id: clientId,
    numero: String(formData.get("numero") ?? "") || null,
    descrizione: String(formData.get("descrizione") ?? "") || null,
    importo: Number(formData.get("importo") ?? 0),
    data_invio: String(formData.get("data_invio") ?? ""),
    luogo_lavoro: String(formData.get("luogo_lavoro") ?? "") || null,
  });

  revalidatePath("/app/preventivi");
  revalidatePath("/app");
}

export async function updatePreventivo(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const clientId = String(formData.get("client_id") ?? "");
  await requireOwnClient(supabase, clientId, user.id);

  await supabase
    .from("quotes")
    .update({
      client_id: clientId,
      numero: String(formData.get("numero") ?? "") || null,
      descrizione: String(formData.get("descrizione") ?? "") || null,
      importo: Number(formData.get("importo") ?? 0),
      data_invio: String(formData.get("data_invio") ?? ""),
      luogo_lavoro: String(formData.get("luogo_lavoro") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/app/preventivi");
  revalidatePath("/app");
}

export async function updatePreventivoStatus(id: string, status: "accettato" | "rifiutato") {
  const { supabase, user } = await requireUser();
  await supabase.from("quotes").update({ status }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/preventivi");
  revalidatePath("/app");
}

export async function deletePreventivo(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("quotes").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/preventivi");
  revalidatePath("/app");
}

export interface ImportFattureResult {
  imported: number;
  clientiCreati: number;
  errors: CsvRowError[];
}

export async function importFatture(csvText: string): Promise<ImportFattureResult> {
  const { supabase, user } = await requireUser();
  const { rows, errors } = parseFattureCsv(csvText);

  if (rows.length === 0) {
    return { imported: 0, clientiCreati: 0, errors };
  }

  const { data: existingClients } = await supabase
    .from("clients")
    .select("id, nome, telefono")
    .eq("user_id", user.id);

  const byPhone = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const c of existingClients ?? []) {
    if (c.telefono) byPhone.set(normalizePhoneForWhatsapp(c.telefono), c.id);
    byName.set(c.nome.trim().toLowerCase(), c.id);
  }

  const rowsWithClientId: { row: ParsedFatturaRow; clientId: string }[] = [];
  let clientiCreati = 0;

  for (const row of rows) {
    const phoneKey = row.telefono ? normalizePhoneForWhatsapp(row.telefono) : null;
    const nameKey = row.cliente.trim().toLowerCase();

    const existingClientId: string | undefined = (phoneKey && byPhone.get(phoneKey)) || byName.get(nameKey);
    let clientId: string;

    if (existingClientId) {
      clientId = existingClientId;
    } else {
      const { data: created, error } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          nome: row.cliente,
          telefono: row.telefono,
          email: row.email,
          tipo: "privato",
        })
        .select("id")
        .single();

      if (error || !created) {
        errors.push({ line: row.line, reason: "Impossibile creare il cliente" });
        continue;
      }

      clientId = created.id as string;
      clientiCreati += 1;
      if (phoneKey) byPhone.set(phoneKey, clientId);
      byName.set(nameKey, clientId);
    }

    rowsWithClientId.push({ row, clientId });
  }

  if (rowsWithClientId.length > 0) {
    const { error } = await supabase.from("invoices").insert(
      rowsWithClientId.map(({ row, clientId }) => ({
        user_id: user.id,
        client_id: clientId,
        numero: row.numero,
        descrizione: row.descrizione,
        importo: row.importo,
        data_scadenza: row.data_scadenza,
        luogo_lavoro: row.luogo_lavoro,
      })),
    );

    if (error) {
      return { imported: 0, clientiCreati, errors: [...errors, { line: 0, reason: error.message }] };
    }
  }

  revalidatePath("/app/fatture");
  revalidatePath("/app");

  return { imported: rowsWithClientId.length, clientiCreati, errors };
}

export interface ImportClientiResult {
  imported: number;
  saltati: number;
  errors: CsvRowError[];
}

export async function importClienti(csvText: string): Promise<ImportClientiResult> {
  const { supabase, user } = await requireUser();
  const { rows, errors } = parseClientiCsv(csvText);

  if (rows.length === 0) {
    return { imported: 0, saltati: 0, errors };
  }

  const { data: existingClients } = await supabase
    .from("clients")
    .select("nome, telefono")
    .eq("user_id", user.id);

  const existingPhones = new Set<string>();
  const existingNames = new Set<string>();
  for (const c of existingClients ?? []) {
    if (c.telefono) existingPhones.add(normalizePhoneForWhatsapp(c.telefono));
    existingNames.add(c.nome.trim().toLowerCase());
  }

  const toInsert: ParsedClienteRow[] = [];
  let saltati = 0;

  for (const row of rows) {
    const phoneKey = row.telefono ? normalizePhoneForWhatsapp(row.telefono) : null;
    const nameKey = row.nome.trim().toLowerCase();

    if ((phoneKey && existingPhones.has(phoneKey)) || existingNames.has(nameKey)) {
      saltati += 1;
      continue;
    }

    if (phoneKey) existingPhones.add(phoneKey);
    existingNames.add(nameKey);
    toInsert.push(row);
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("clients").insert(
      toInsert.map((row) => ({
        user_id: user.id,
        nome: row.nome,
        telefono: row.telefono,
        email: row.email,
        tipo: row.tipo,
        indirizzo: row.indirizzo,
      })),
    );

    if (error) {
      return { imported: 0, saltati, errors: [...errors, { line: 0, reason: error.message }] };
    }
  }

  revalidatePath("/app/clienti");

  return { imported: toInsert.length, saltati, errors };
}

export async function updateSollecitoAutomatico(enabled: boolean) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ sollecito_automatico_attivo: enabled })
    .eq("id", user.id);
  revalidatePath("/app/impostazioni");
}

export async function addUscita(formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase.from("uscite").insert({
    user_id: user.id,
    descrizione: String(formData.get("descrizione") ?? ""),
    importo: Number(formData.get("importo") ?? 0),
    data_scadenza: String(formData.get("data_scadenza") ?? ""),
  });

  revalidatePath("/app/uscite");
  revalidatePath("/app");
}

export async function updateUscita(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("uscite")
    .update({
      descrizione: String(formData.get("descrizione") ?? ""),
      importo: Number(formData.get("importo") ?? 0),
      data_scadenza: String(formData.get("data_scadenza") ?? ""),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/app/uscite");
  revalidatePath("/app");
}

export async function markUscitaPagata(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("uscite").update({ status: "pagata" }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/uscite");
  revalidatePath("/app");
}

export async function deleteUscita(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("uscite").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/app/uscite");
  revalidatePath("/app");
}
