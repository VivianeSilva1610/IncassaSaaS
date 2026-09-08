"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";

const strings = {
  it: { copiato: "Copiato!", copiaTesto: "Copia testo" },
  en: { copiato: "Copied!", copiaTesto: "Copy text" },
};

export function CopyTextButton({ text, locale = "it" }: { text: string; locale?: Locale }) {
  const t = strings[locale];
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-300"
    >
      {copied ? t.copiato : t.copiaTesto}
    </button>
  );
}
