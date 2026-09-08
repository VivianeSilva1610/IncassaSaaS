import { Resend } from "resend";
import type { Locale } from "@/lib/anthropic";

export async function sendSollecitoEmail(params: {
  to: string;
  clienteNome: string;
  messaggio: string;
  replyTo: string;
  locale?: Locale;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const locale = params.locale ?? "it";

  const subject = locale === "en" ? "Payment reminder" : "Sollecito pagamento";
  const footer =
    locale === "en"
      ? `Automatic reminder sent by INCASSA on behalf of ${params.replyTo}. For any question, to
        dispute this reminder, or to let us know the payment has already been made, reply directly
        to this email.`
      : `Promemoria automatico inviato da INCASSA per conto di ${params.replyTo}. Per qualsiasi
        chiarimento, contestazione o per segnalare che il pagamento è già stato effettuato,
        rispondi direttamente a questa email.`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: params.to,
    replyTo: params.replyTo,
    subject,
    html: `
      <p>${params.messaggio.replace(/\n/g, "<br>")}</p>
      <p style="margin-top: 24px; color: #78716c; font-size: 12px;">
        ${footer}
      </p>
    `,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
