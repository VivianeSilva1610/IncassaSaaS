import { Resend } from "resend";
import { buildKitText } from "@/lib/kit-file";

export async function sendKitEmail(email: string, sessionId: string) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const accessUrl = `${siteUrl}/acesso?session_id=${sessionId}`;
  const kitText = buildKitText();

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: email,
    subject: "Il tuo Kit Incassa è pronto",
    html: `
      <p>Grazie per il tuo acquisto!</p>
      <p>Puoi accedere ai tuoi 37 messaggi in qualsiasi momento da qui:</p>
      <p><a href="${accessUrl}">${accessUrl}</a></p>
      <p>In allegato trovi anche il file con tutti i messaggi pronti da copiare e incollare.</p>
    `,
    attachments: [
      {
        filename: "kit-incassa-37-messaggi.txt",
        content: Buffer.from(kitText, "utf-8").toString("base64"),
      },
    ],
  });
}
