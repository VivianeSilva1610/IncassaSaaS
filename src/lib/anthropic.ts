import Anthropic from "@anthropic-ai/sdk";
import type { Tone } from "@/content/kit-incassa";

const restauranteExamplesByTone: Record<"BR" | "IT", Record<Tone, string[]>> = {
  BR: {
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
  },
  IT: {
    Gentile: [
      "Ciao [Nome], tutto bene? Ti scrivo solo per ricordarti dell'ordine di [Valor] del [Data] — capita di dimenticarsene, se hai bisogno scrivimi pure 😊",
      "Ciao [Nome], quel piccolo ordine di [Valor] risulta ancora aperto qui. Nessuna fretta, fammi sapere quando riesci a sistemarlo!",
    ],
    Cordiale: [
      "Buongiorno [Nome], le scrivo riguardo all'ordine di [Valor] del [Data], che risulta ancora aperto. Resto a disposizione per qualsiasi chiarimento.",
      "Buongiorno [Nome], non risulta ancora il pagamento dell'ordine di [Valor]. Può confermarmi quando riesce a saldarlo?",
    ],
    Diretto: [
      "[Nome], l'ordine di [Valor] del [Data] risulta ancora aperto. Può indicarmi una data certa per il pagamento?",
      "[Nome], non risulta ancora ricevuto il pagamento di [Valor] relativo all'ordine. Fammi sapere quando riesci a pagare.",
    ],
    Formale: [
      "Gentile [Nome], la informiamo che l'ordine dell'importo di [Valor], effettuato il [Data], risulta a tutt'oggi non saldato. Le chiediamo cortesemente di provvedere alla regolarizzazione.",
      "Gentile [Nome], in riferimento all'ordine di [Valor] del [Data], non risulta ancora pervenuto il pagamento. La preghiamo di comunicarci i tempi previsti per il saldo.",
    ],
  },
};

function formatValor(value: number, country: "BR" | "IT"): string {
  return country === "IT"
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value)
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export async function generateSollecitoMessageRestaurante(params: {
  tono: Tone;
  clienteNome: string;
  valor: number;
  dataVencimento: string;
  diasAtraso: number;
  country?: "BR" | "IT";
}): Promise<string> {
  const country = params.country ?? "BR";
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const examples = restauranteExamplesByTone[country][params.tono].map((t) => `- ${t}`).join("\n");
  const idioma = country === "IT" ? "italiano" : "português do Brasil";

  const prompt = `Escreva UMA mensagem curta em ${idioma} (estilo WhatsApp) pra cobrar um pedido do restaurante vendido a prazo e ainda não pago.

Dados:
- Cliente: ${params.clienteNome}
- Valor: ${formatValor(params.valor, country)}
- Vencimento: ${params.dataVencimento} (${params.diasAtraso} dias de atraso)
- Tom pedido: ${params.tono}

Exemplos do estilo/tom "${params.tono}" a seguir, no idioma certo (NÃO copie, é só referência):
${examples}

Responda APENAS com o texto da mensagem, no idioma pedido acima, sem introdução, sem aspas, pronta pra colar no WhatsApp.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : "";
}
