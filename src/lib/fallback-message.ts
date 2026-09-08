import { messages as kitMessages, type Tone } from "@/content/kit-incassa";
import { formatEuro } from "@/lib/urgency";
import type { Locale } from "@/lib/anthropic";

function pickCategory(giorniRitardo: number): string {
  if (giorniRitardo > 14) return "sollecito-finale";
  if (giorniRitardo >= 8) return "ritardo-medio";
  return "ritardo-lieve";
}

const preventivoTemplates: Record<Tone, string[]> = {
  Gentile: [
    "Ciao [Nome], ti scrivo per il preventivo di [Importo] che ti avevo inviato il [Data]. Hai avuto modo di darci un'occhiata? Sono qui per qualsiasi domanda 😊",
    "Ciao [Nome], volevo solo sapere se hai avuto tempo di pensare al preventivo di [Importo]. Nessuna fretta, fammi sapere quando vuoi!",
  ],
  Cordiale: [
    "Buongiorno [Nome], le scrivo in merito al preventivo n. [Numero] di [Importo] inviato il [Data]. Resto a disposizione per qualsiasi chiarimento o modifica.",
    "Buongiorno [Nome], non avendo ricevuto riscontro sul preventivo di [Importo], volevo sapere se è ancora di suo interesse.",
  ],
  Diretto: [
    "[Nome], ti avevo mandato un preventivo di [Importo] il [Data] e non ho ancora ricevuto risposta. Sei ancora interessato/a?",
    "[Nome], hai deciso qualcosa riguardo al preventivo di [Importo]? Fammi sapere così organizzo il lavoro.",
  ],
  Formale: [
    "Gentile [Nome], facciamo seguito al preventivo n. [Numero] del [Data], per un importo di [Importo], del quale non abbiamo ancora ricevuto riscontro. Restiamo a disposizione per eventuali chiarimenti.",
    "Gentile [Nome], la informiamo che il preventivo di [Importo] inviato il [Data] è ancora in attesa di una sua risposta. La invitiamo a farci sapere come procedere.",
  ],
};

const preventivoTemplatesEn: Record<Tone, string[]> = {
  Gentile: [
    "Hi [Name], writing about the quote for [Importo] I sent you on [Data]. Have you had a chance to look it over? Happy to answer any questions 😊",
    "Hi [Name], just wondering if you've had time to think about the quote for [Importo]. No rush, let me know whenever!",
  ],
  Cordiale: [
    "Hello [Name], following up on quote #[Numero] for [Importo] sent on [Data]. Happy to help with any questions or changes.",
    "Hello [Name], I haven't heard back about the quote for [Importo] — just checking if it's still of interest.",
  ],
  Diretto: [
    "[Name], I sent you a quote for [Importo] on [Data] and haven't heard back yet. Still interested?",
    "[Name], have you decided anything about the quote for [Importo]? Let me know so I can plan accordingly.",
  ],
  Formale: [
    "Dear [Name], following up on quote #[Numero] dated [Data], for an amount of [Importo], for which we have not yet received a response. We remain available for any clarification.",
    "Dear [Name], we would like to inform you that the quote for [Importo] sent on [Data] is still awaiting your response. Please let us know how you would like to proceed.",
  ],
};

function fillTemplate(
  template: string,
  vars: { nome: string; importo: number; data: string; numero?: string | null },
): string {
  let result = template
    .replaceAll("[Nome]", vars.nome)
    .replaceAll("[Name]", vars.nome)
    .replaceAll("[Importo]", formatEuro(vars.importo))
    .replaceAll("[Data]", vars.data)
    .replaceAll("[Data di scadenza]", vars.data)
    .replaceAll("[Data Lavoro]", vars.data);

  if (vars.numero) {
    result = result.replaceAll("[Numero]", vars.numero);
  } else {
    result = result.replace(/\s*n\.\s*\[Numero\]/g, "").replace(/\s*#\[Numero\]/g, "");
  }

  return result;
}

/** Fino a 3 messaggi pronti (dal Kit Incassa per le fatture, o dedicati per i preventivi), usati quando l'IA non è disponibile. */
export function getFallbackMessages(params: {
  tono: Tone;
  clienteNome: string;
  importo: number;
  data: string;
  giorniRitardo: number;
  numero?: string | null;
  tipoDocumento: "fattura" | "preventivo";
  locale?: Locale;
}): string[] {
  const locale = params.locale ?? "it";
  const vars = {
    nome: params.clienteNome,
    importo: params.importo,
    data: params.data,
    numero: params.numero,
  };

  if (params.tipoDocumento === "preventivo") {
    const templates = locale === "en" ? preventivoTemplatesEn : preventivoTemplates;
    return templates[params.tono].map((t) => fillTemplate(t, vars));
  }

  if (locale === "en") {
    // Nessun set di 37 messaggi tradotto per le fatture: un unico fallback generico per tono.
    const fallbackByTone: Record<Tone, string> = {
      Gentile:
        "Hi [Name], hope you're doing well! Just a reminder that invoice #[Numero] for [Importo] was due on [Data]. Whenever you get a minute, I'd appreciate you taking a look 😊",
      Cordiale:
        "Hello [Name], following up on invoice #[Numero] for [Importo], due on [Data]. Happy to help with any questions.",
      Diretto:
        "[Name], invoice #[Numero] for [Importo] was due on [Data] and is still unpaid. Can you let me know when I'll receive payment?",
      Formale:
        "Dear [Name], invoice #[Numero], for an amount of [Importo], due on [Data], remains unpaid as of today. Please regularize the position at your earliest convenience.",
    };
    return [fillTemplate(fallbackByTone[params.tono], vars)];
  }

  const categorySlug = pickCategory(params.giorniRitardo);
  const sameTone = kitMessages.filter((m) => m.tone === params.tono);

  const prioritized = [
    ...sameTone.filter((m) => m.categorySlug === categorySlug),
    ...sameTone.filter((m) => m.categorySlug !== categorySlug),
  ].slice(0, 3);

  return prioritized.map((m) => fillTemplate(m.text, vars));
}
