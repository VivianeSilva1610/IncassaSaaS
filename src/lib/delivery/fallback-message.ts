import type { Tone } from "@/content/kit-incassa";

function formatValor(value: number, country: "BR" | "IT"): string {
  return country === "IT"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const fallbackByTone: Record<"BR" | "IT", Record<Tone, string>> = {
  BR: {
    Gentile: "Oi [Nome], tudo bem? Só lembrando do pedido de [Valor] do dia [Data], que ainda tá em aberto. Qualquer coisa me chama 😊",
    Cordiale: "Olá [Nome], escrevo sobre o pedido de [Valor] de [Data], ainda em aberto. Fico à disposição.",
    Diretto: "[Nome], o pedido de [Valor] do dia [Data] ainda está em aberto. Pode me confirmar quando paga?",
    Formale: "Prezado(a) [Nome], o pedido no valor de [Valor], de [Data], permanece em aberto. Solicitamos a regularização o quanto antes.",
  },
  IT: {
    Gentile: "Ciao [Nome], tutto bene? Ti ricordo solo l'ordine di [Valor] del [Data], ancora aperto. Se hai bisogno scrivimi 😊",
    Cordiale: "Buongiorno [Nome], le scrivo riguardo all'ordine di [Valor] del [Data], ancora aperto. Resto a disposizione.",
    Diretto: "[Nome], l'ordine di [Valor] del [Data] risulta ancora aperto. Può confermarmi quando paga?",
    Formale: "Gentile [Nome], l'ordine dell'importo di [Valor], del [Data], risulta ancora non saldato. Le chiediamo di provvedere alla regolarizzazione.",
  },
};

/** Mensagem pronta, usada quando a IA não está disponível. */
export function getFallbackMessageRestaurante(params: {
  tono: Tone;
  clienteNome: string;
  valor: number;
  dataVencimento: string;
  country?: "BR" | "IT";
}): string {
  const country = params.country ?? "BR";
  return fallbackByTone[country][params.tono]
    .replaceAll("[Nome]", params.clienteNome)
    .replaceAll("[Valor]", formatValor(params.valor, country))
    .replaceAll("[Data]", params.dataVencimento);
}
