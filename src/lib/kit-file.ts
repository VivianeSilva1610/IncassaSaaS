import { categories, messages } from "@/content/kit-incassa";

export function buildKitText(): string {
  const lines: string[] = [];

  lines.push("KIT INCASSA");
  lines.push("37 messaggi pronti per farti pagare senza rovinare il rapporto con il cliente.");
  lines.push("");
  lines.push("Sostituisci le parti tra [parentesi quadre] con i dati reali prima di inviare.");
  lines.push("=".repeat(60));

  for (const category of categories) {
    const categoryMessages = messages.filter((m) => m.categorySlug === category.slug);
    if (categoryMessages.length === 0) continue;

    lines.push("");
    lines.push(category.name.toUpperCase());
    lines.push("-".repeat(category.name.length));

    for (const message of categoryMessages) {
      lines.push("");
      lines.push(message.tone ? `[Tono: ${message.tone}]` : "");
      lines.push(message.text);
    }
  }

  return lines.join("\n");
}
