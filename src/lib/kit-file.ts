import { getKitCategories, getKitMessages } from "@/lib/kit-content";
import type { Locale } from "@/lib/locale";

const strings = {
  it: {
    header: "KIT INCASSA",
    subheader: "37 messaggi pronti per farti pagare senza rovinare il rapporto con il cliente.",
    instructions: "Sostituisci le parti tra [parentesi quadre] con i dati reali prima di inviare.",
    tono: "Tono",
  },
  en: {
    header: "KIT INCASSA",
    subheader: "37 ready-to-send messages to get paid without damaging the relationship with your client.",
    instructions: "Replace the parts in [square brackets] with the real details before sending.",
    tono: "Tone",
  },
};

export function buildKitText(locale: Locale = "it"): string {
  const t = strings[locale];
  const categories = getKitCategories(locale);
  const messages = getKitMessages(locale);
  const lines: string[] = [];

  lines.push(t.header);
  lines.push(t.subheader);
  lines.push("");
  lines.push(t.instructions);
  lines.push("=".repeat(60));

  for (const category of categories) {
    const categoryMessages = messages.filter((m) => m.categorySlug === category.slug);
    if (categoryMessages.length === 0) continue;

    lines.push("");
    lines.push(category.name.toUpperCase());
    lines.push("-".repeat(category.name.length));

    for (const message of categoryMessages) {
      lines.push("");
      lines.push(message.tone ? `[${t.tono}: ${message.tone}]` : "");
      lines.push(message.text);
    }
  }

  return lines.join("\n");
}
