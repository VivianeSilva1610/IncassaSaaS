import { messages as kitMessages, type Tone } from "@/content/kit-incassa";
import { formatEuro } from "@/lib/urgency";

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

function fillTemplate(
  template: string,
  vars: { nome: string; importo: number; data: string; numero?: string | null },
): string {
  let result = template
    .replaceAll("[Nome]", vars.nome)
    .replaceAll("[Importo]", formatEuro(vars.importo))
    .replaceAll("[Data]", vars.data)
    .replaceAll("[Data di scadenza]", vars.data)
    .replaceAll("[Data Lavoro]", vars.data);

  if (vars.numero) {
    result = result.replaceAll("[Numero]", vars.numero);
  } else {
    result = result.replace(/\s*n\.\s*\[Numero\]/g, "");
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
}): string[] {
  const vars = {
    nome: params.clienteNome,
    importo: params.importo,
    data: params.data,
    numero: params.numero,
  };

  if (params.tipoDocumento === "preventivo") {
    return preventivoTemplates[params.tono].map((t) => fillTemplate(t, vars));
  }

  const categorySlug = pickCategory(params.giorniRitardo);
  const sameTone = kitMessages.filter((m) => m.tone === params.tono);

  const prioritized = [
    ...sameTone.filter((m) => m.categorySlug === categorySlug),
    ...sameTone.filter((m) => m.categorySlug !== categorySlug),
  ].slice(0, 3);

  return prioritized.map((m) => fillTemplate(m.text, vars));
}
