"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

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

export async function addCliente(formData: FormData) {
  const { supabase, user } = await requireUser();

  await supabase.from("clients").insert({
    user_id: user.id,
    nome: String(formData.get("nome") ?? ""),
    telefono: String(formData.get("telefono") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    tipo: String(formData.get("tipo") ?? "privato"),
  });

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
  });

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
  });

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
