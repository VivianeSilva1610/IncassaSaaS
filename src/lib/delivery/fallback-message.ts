import type { Tone } from "@/content/kit-incassa";

function formatReal(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const fallbackByTone: Record<Tone, string> = {
  Gentile: "Oi [Nome], tudo bem? Só lembrando do pedido de [Valor] do dia [Data], que ainda tá em aberto. Qualquer coisa me chama 😊",
  Cordiale: "Olá [Nome], escrevo sobre o pedido de [Valor] de [Data], ainda em aberto. Fico à disposição.",
  Diretto: "[Nome], o pedido de [Valor] do dia [Data] ainda está em aberto. Pode me confirmar quando paga?",
  Formale: "Prezado(a) [Nome], o pedido no valor de [Valor], de [Data], permanece em aberto. Solicitamos a regularização o quanto antes.",
};

/** Mensagem pronta, usada quando a IA não está disponível. */
export function getFallbackMessageRestaurante(params: {
  tono: Tone;
  clienteNome: string;
  valor: number;
  dataVencimento: string;
}): string {
  return fallbackByTone[params.tono]
    .replaceAll("[Nome]", params.clienteNome)
    .replaceAll("[Valor]", formatReal(params.valor))
    .replaceAll("[Data]", params.dataVencimento);
}
