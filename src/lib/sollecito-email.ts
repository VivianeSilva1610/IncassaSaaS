import { Resend } from "resend";

export async function sendSollecitoEmail(params: {
  to: string;
  clienteNome: string;
  messaggio: string;
  replyTo: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: params.to,
    replyTo: params.replyTo,
    subject: "Sollecito pagamento",
    html: `
      <p>${params.messaggio.replace(/\n/g, "<br>")}</p>
      <p style="margin-top: 24px; color: #78716c; font-size: 12px;">
        Promemoria automatico inviato da INCASSA per conto di ${params.replyTo}. Per qualsiasi
        chiarimento, contestazione o per segnalare che il pagamento è già stato effettuato,
        rispondi direttamente a questa email.
      </p>
    `,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
