import { NextResponse } from "next/server";
import { requireRestaurantSubscription } from "@/lib/subscription";

// Chamado via navigator.sendBeacon no beforeunload — melhor esforço pra
// liberar a vaga na hora, em vez de esperar a aba expirar pelo heartbeat.
export async function POST(req: Request) {
  const { user, supabase } = await requireRestaurantSubscription();
  const { abaId } = (await req.json()) as { abaId?: string };
  if (!abaId) return NextResponse.json({ error: "abaId ausente." }, { status: 400 });

  await supabase.from("restaurant_abas_ativas").delete().eq("user_id", user.id).eq("aba_id", abaId);
  return NextResponse.json({ ok: true });
}
