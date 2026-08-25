import { getStripe } from "@/lib/stripe";

export async function verifyPaidSession(sessionId: string): Promise<{ email: string } | null> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email ?? session.customer_email;

    if (session.payment_status === "paid" && email) {
      return { email };
    }

    return null;
  } catch {
    return null;
  }
}
