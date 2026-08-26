import Anthropic from "@anthropic-ai/sdk";
import { messages as kitMessages, type Tone } from "@/content/kit-incassa";

function getFewShotExamples(tono: Tone): string {
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
}): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const examples = getFewShotExamples(params.tono);

  const prompt = `Scrivi UN messaggio breve in italiano (stile WhatsApp) per sollecitare il pagamento di ${
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
