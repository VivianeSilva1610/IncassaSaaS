import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";

const LIMITE_ABAS_PADRAO = 3;
// Aba sem ping há mais tempo que isso é tratada como fechada — libera a vaga
// sem depender do beforeunload (que nem sempre dispara).
const JANELA_ATIVA_SEGUNDOS = 45;

export async function POST(req: Request) {
  const { user, supabase, addonAbasIlimitadas } = await requireRestaurantSubscription();
  const { abaId } = (await req.json()) as { abaId?: string };
  if (!abaId) return NextResponse.json({ error: "abaId ausente." }, { status: 400 });

  const limiteCorte = new Date(Date.now() - JANELA_ATIVA_SEGUNDOS * 1000).toISOString();

  // Limpa abas velhas deste usuário (fechadas sem avisar) antes de contar.
  await supabase.from("restaurant_abas_ativas").delete().eq("user_id", user.id).lt("ultimo_ping_em", limiteCorte);

  const { data: jaRegistrada } = await supabase
    .from("restaurant_abas_ativas")
    .select("id")
    .eq("user_id", user.id)
    .eq("aba_id", abaId)
    .maybeSingle();

  if (jaRegistrada) {
    await supabase.from("restaurant_abas_ativas").update({ ultimo_ping_em: new Date().toISOString() }).eq("id", jaRegistrada.id);
    return NextResponse.json({ ok: true, bloqueado: false });
  }

  if (!addonAbasIlimitadas) {
    const { count } = await supabase.from("restaurant_abas_ativas").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count ?? 0) >= LIMITE_ABAS_PADRAO) {
      return NextResponse.json({ ok: true, bloqueado: true, limite: LIMITE_ABAS_PADRAO });
    }
  }

  await supabase.from("restaurant_abas_ativas").insert({ user_id: user.id, aba_id: abaId });
  return NextResponse.json({ ok: true, bloqueado: false });
}
