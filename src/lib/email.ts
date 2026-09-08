import { Resend } from "resend";
import { buildKitText } from "@/lib/kit-file";
import type { Locale } from "@/lib/locale";

const strings = {
  it: {
    subject: "Il tuo Kit Incassa è pronto",
    thanks: "Grazie per il tuo acquisto!",
    accessAnytime: "Puoi accedere ai tuoi 37 messaggi in qualsiasi momento da qui:",
    attachmentNote: "In allegato trovi anche il file con tutti i messaggi pronti da copiare e incollare.",
  },
  en: {
    subject: "Your Kit Incassa is ready",
    thanks: "Thank you for your purchase!",
    accessAnytime: "You can access your 37 messages any time from here:",
    attachmentNote: "You'll also find attached the file with all the ready-to-send messages.",
  },
};

const recessoStrings = {
  it: {
    subject: "Conferma di ricezione — richiesta di recesso",
    intro: (tipo: "saas" | "kit") =>
      `Confermiamo di aver ricevuto la tua richiesta di recesso relativa a${
        tipo === "saas" ? " all'abbonamento INCASSA" : " al Kit Incassa"
      }.`,
    reference: "Riferimento richiesta:",
    receivedAt: "Ricevuta il:",
    cancelledNow: "Il tuo abbonamento è stato annullato immediatamente e non riceverai ulteriori addebiti.",
    reviewManually: "La tua richiesta è stata registrata e verrà gestita manualmente dal nostro team.",
    questions: "Per qualsiasi domanda, rispondi a questa email.",
  },
  en: {
    subject: "Confirmation of receipt — withdrawal request",
    intro: (tipo: "saas" | "kit") =>
      `We confirm we have received your withdrawal request regarding${
        tipo === "saas" ? " your INCASSA subscription" : " the Kit Incassa"
      }.`,
    reference: "Request reference:",
    receivedAt: "Received on:",
    cancelledNow: "Your subscription has been cancelled immediately and you will not be charged again.",
    reviewManually: "Your request has been recorded and will be handled manually by our team.",
    questions: "For any question, just reply to this email.",
  },
};

export async function sendRecessoConfirmationEmail(
  email: string,
  locale: Locale,
  tipo: "saas" | "kit",
  reference: string,
  cancelledAutomatically: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = recessoStrings[locale];
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const receivedAt = new Date().toLocaleString(locale === "it" ? "it-IT" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: email,
    subject: t.subject,
    html: `
      <p>${t.intro(tipo)}</p>
      <p>${t.reference} <strong>${reference}</strong><br/>${t.receivedAt} ${receivedAt}</p>
      <p>${tipo === "saas" && cancelledAutomatically ? t.cancelledNow : t.reviewManually}</p>
      <p>${t.questions}</p>
    `,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendKitEmail(
  email: string,
  sessionId: string,
  locale: Locale = "it",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = strings[locale];
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const accessUrl = `${siteUrl}/acesso?session_id=${sessionId}`;
  const kitText = buildKitText(locale);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: email,
    subject: t.subject,
    html: `
      <p>${t.thanks}</p>
      <p>${t.accessAnytime}</p>
      <p><a href="${accessUrl}">${accessUrl}</a></p>
      <p>${t.attachmentNote}</p>
    `,
    attachments: [
      {
        filename: "kit-incassa-37-messaggi.txt",
        content: Buffer.from(kitText, "utf-8").toString("base64"),
      },
    ],
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
