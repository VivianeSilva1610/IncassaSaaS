import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendKitEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email;

    if (email && session.payment_status === "paid") {
      const supabase = getSupabaseAdmin();

      const { data: purchase, error } = await supabase
        .from("purchases")
        .upsert(
          {
            stripe_session_id: session.id,
            email,
            product: "kit_incassa",
            status: "paid",
          },
          { onConflict: "stripe_session_id" },
        )
        .select()
        .single();

      if (!error && purchase && !purchase.email_sent_at) {
        await sendKitEmail(email, session.id);
        await supabase
          .from("purchases")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", purchase.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
