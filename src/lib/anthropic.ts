import Anthropic from "@anthropic-ai/sdk";
import { messages as kitMessages, type Tone } from "@/content/kit-incassa";
import type { Locale } from "@/lib/locale";

export type { Locale };

const enExamplesByTone: Record<Tone, string[]> = {
  Gentile: [
    "Hi [Name], hope you're doing well! Just a quick reminder that invoice #[Number] for [Amount] was due on [Date]. It probably slipped your mind — whenever you get a minute, I'd appreciate you taking a look 😊",
    "Hi [Name], just checking in about invoice #[Number] for [Amount]. No rush, just let me know when you can!",
  ],
  Cordiale: [
    "Hello [Name], writing about invoice #[Number] for [Amount], sent on [Date]. Happy to help with any questions.",
    "Hello [Name], I haven't heard back about invoice #[Number] for [Amount] yet — could you let me know the status when you have a moment?",
  ],
  Diretto: [
    "[Name], this is the second reminder for invoice #[Number] for [Amount]. I still haven't received payment or a response. I need a firm date for when I'll receive the balance.",
    "[Name], invoice #[Number] for [Amount] is still open. Can you let me know when I'll receive payment?",
  ],
  Formale: [
    "Dear [Name], this is to inform you that invoice #[Number], issued on [Date] and due on [Date], for an amount of [Amount], remains unpaid as of today. Please regularize the position at your earliest convenience.",
    "Dear [Name], we are following up on invoice #[Number] for [Amount], sent on [Date], for which we have not yet received a response.",
  ],
};

function getFewShotExamples(tono: Tone, locale: Locale): string {
  if (locale === "en") {
    return enExamplesByTone[tono].map((t) => `- ${t}`).join("\n");
  }
  return kitMessages
    .filter((m) => m.tone === tono)
    .slice(0, 4)
    .map((m) => `- ${m.text}`)
    .join("\n");
}

export async function generateSollecitoMessage(params: {
  tono: Tone;
  clienteNome: string;
  importo: number;
  data: string;
  tipoDocumento: "fattura" | "preventivo";
  giorniRitardo: number;
  numero?: string | null;
  locale?: Locale;
}): Promise<string> {
  const locale = params.locale ?? "it";
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const examples = getFewShotExamples(params.tono, locale);

  const prompt =
    locale === "en"
      ? `Write ONE short message in American English (WhatsApp style) to follow up on ${
          params.tipoDocumento === "fattura" ? "an overdue invoice" : "a quote with no response"
        }.

Details:
- Client: ${params.clienteNome}
${params.numero ? `- ${params.tipoDocumento === "fattura" ? "Invoice" : "Quote"} number: ${params.numero}\n` : ""}- Amount: €${params.importo.toFixed(2)}
- ${
          params.tipoDocumento === "fattura"
            ? `Due date: ${params.data} (${params.giorniRitardo} days overdue)`
            : `Sent on: ${params.data}`
        }
- Requested tone: ${params.tono} (Gentile=Friendly, Cordiale=Polite, Diretto=Direct, Formale=Formal)

Examples of the "${params.tono}" style/tone to follow (do NOT copy, reference only):
${examples}

Reply ONLY with the message text, no introduction, no quotes, ready to copy and paste into WhatsApp.`
      : `Scrivi UN messaggio breve in italiano (stile WhatsApp) per sollecitare il pagamento di ${
          params.tipoDocumento === "fattura" ? "una fattura scaduta" : "un preventivo senza risposta"
        }.

Dati:
- Cliente: ${params.clienteNome}
${params.numero ? `- Numero ${params.tipoDocumento}: ${params.numero}\n` : ""}- Importo: €${params.importo.toFixed(2)}
- ${
          params.tipoDocumento === "fattura"
            ? `Scadenza: ${params.data} (${params.giorniRitardo} giorni di ritardo)`
            : `Inviato il: ${params.data}`
        }
- Tono richiesto: ${params.tono}

Esempi dello stile/tono "${params.tono}" da seguire (NON copiare, sono solo riferimento):
${examples}

Rispondi SOLO con il testo del messaggio, senza introduzioni, senza virgolette, pronto da copiare e incollare su WhatsApp.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "";
}

// Mesmo motor (Anthropic, mesmo modelo, mesma lógica de tom) usado pelo
// INCASSA acima, mas com prompt e exemplos próprios pro restaurante:
// português do Brasil, reais, e "pedido a prazo" em vez de fattura/
// preventivo italiano — por isso uma função separada, não um branch de
// locale na generateSollecitoMessage (que é especificamente fattura/
// preventivo do INCASSA).
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
