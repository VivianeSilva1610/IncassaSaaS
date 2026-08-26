"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
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

  await supabase.from("invoices").insert({
    user_id: user.id,
    client_id: String(formData.get("client_id") ?? ""),
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

  await supabase
    .from("invoices")
    .update({
      client_id: String(formData.get("client_id") ?? ""),
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

  await supabase.from("quotes").insert({
    user_id: user.id,
    client_id: String(formData.get("client_id") ?? ""),
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

  await supabase
    .from("quotes")
    .update({
      client_id: String(formData.get("client_id") ?? ""),
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
