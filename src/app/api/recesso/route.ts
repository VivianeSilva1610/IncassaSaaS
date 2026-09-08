import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendRecessoConfirmationEmail } from "@/lib/email";
import type { Locale } from "@/lib/locale";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const tipo = body.tipo === "kit" ? "kit" : body.tipo === "saas" ? "saas" : null;
  const motivo = typeof body.motivo === "string" ? body.motivo.trim().slice(0, 2000) : null;
  const locale: Locale = body.locale === "en" ? "en" : "it";

  if (!email || !email.includes("@") || !tipo) {
    return NextResponse.json({ error: "Dati mancanti o non validi" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  let stripeSubscriptionId: string | null = null;
  let cancelledAutomatically = false;
  let userId: string | null = null;

  if (tipo === "saas") {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, stripe_subscription_id")
      .eq("email", email)
      .maybeSingle();

    if (profile?.id) {
      userId = profile.id;
    }

    if (profile?.stripe_subscription_id) {
      stripeSubscriptionId = profile.stripe_subscription_id;
      try {
        await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
        cancelledAutomatically = true;
      } catch (err) {
        console.error("Failed to cancel subscription during recesso:", err);
      }
    }
  }

  const { data: richiesta, error } = await admin
    .from("recesso_richieste")
    .insert({
      user_id: userId,
      email,
      tipo,
      motivo,
      stripe_subscription_id: stripeSubscriptionId,
      cancellato_automaticamente: cancelledAutomatically,
    })
    .select("id")
    .single();

  if (error || !richiesta) {
    console.error("Failed to record recesso request:", error);
    return NextResponse.json({ error: "Impossibile registrare la richiesta" }, { status: 500 });
  }

  const emailResult = await sendRecessoConfirmationEmail(
    email,
    locale,
    tipo,
    richiesta.id,
    cancelledAutomatically,
  );
  if (!emailResult.ok) {
    console.error("Failed to send recesso confirmation email:", emailResult.error);
  }

  return NextResponse.json({ ok: true, reference: richiesta.id });
}
