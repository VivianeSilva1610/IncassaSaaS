import Anthropic from "@anthropic-ai/sdk";
import type { Tone } from "@/content/kit-incassa";

const restauranteExamplesByTone: Record<Tone, string[]> = {
  Gentile: [
    "Oi [Nome], tudo bem? Passando só pra lembrar do pedido de [Valor] lá do dia [Data] — sei que às vezes passa batido, qualquer coisa me chama 😊",
    "Oi [Nome], aquele pedidinho de [Valor] ainda tá em aberto aqui. Sem pressa, só avisa quando puder acertar!",
  ],
  Cordiale: [
    "Olá [Nome], escrevo sobre o pedido de [Valor] feito em [Data], que ainda consta em aberto. Fico à disposição pra qualquer dúvida.",
    "Olá [Nome], ainda não recebi o pagamento do pedido de [Valor]. Pode me confirmar quando consegue acertar?",
  ],
  Diretto: [
    "[Nome], o pedido de [Valor] do dia [Data] ainda está em aberto. Pode me passar uma data certa pra pagamento?",
    "[Nome], ainda não recebi o valor de [Valor] referente ao pedido. Me avisa quando vai poder pagar?",
  ],
  Formale: [
    "Prezado(a) [Nome], viemos informar que o pedido no valor de [Valor], realizado em [Data], permanece em aberto até o momento. Solicitamos a regularização o quanto antes.",
    "Prezado(a) [Nome], referente ao pedido de [Valor] de [Data], ainda não identificamos o pagamento. Favor nos informar a previsão de quitação.",
  ],
};

function formatReal(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export async function generateSollecitoMessageRestaurante(params: {
  tono: Tone;
  clienteNome: string;
  valor: number;
  dataVencimento: string;
  diasAtraso: number;
}): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const examples = restauranteExamplesByTone[params.tono].map((t) => `- ${t}`).join("\n");

  const prompt = `Escreva UMA mensagem curta em português do Brasil (estilo WhatsApp) pra cobrar um pedido do restaurante vendido a prazo e ainda não pago.

Dados:
- Cliente: ${params.clienteNome}
- Valor: ${formatReal(params.valor)}
- Vencimento: ${params.dataVencimento} (${params.diasAtraso} dias de atraso)
- Tom pedido: ${params.tono}

Exemplos do estilo/tom "${params.tono}" a seguir (NÃO copie, é só referência):
${examples}

Responda APENAS com o texto da mensagem, sem introdução, sem aspas, pronta pra colar no WhatsApp.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "";
}
