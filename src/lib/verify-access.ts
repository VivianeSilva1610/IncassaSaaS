import { getStripe } from "@/lib/stripe";
import type { Locale } from "@/lib/locale";

export async function verifyPaidSession(sessionId: string): Promise<{ email: string; locale: Locale } | null> {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email ?? session.customer_email;
    const locale: Locale = session.metadata?.locale === "en" ? "en" : "it";

    if (session.payment_status === "paid" && email) {
      return { email, locale };
    }

    return null;
  } catch {
    return null;
  }
}
