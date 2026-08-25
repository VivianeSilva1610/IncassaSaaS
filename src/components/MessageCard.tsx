"use client";

import { useState } from "react";
import type { Tone } from "@/content/kit-incassa";

const toneEmoji: Record<Tone, string> = {
  Gentile: "😊",
  Cordiale: "🙂",
  Diretto: "😐",
  Formale: "⚠️",
};

export function MessageCard({ text, tone }: { text: string; tone?: Tone }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      {tone && (
        <span className="mb-2 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
          {toneEmoji[tone]} {tone}
        </span>
      )}
      <p className="whitespace-pre-wrap text-sm text-neutral-800">{text}</p>
      <button
        onClick={handleCopy}
        className="mt-3 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
      >
        {copied ? "Copiato!" : "Copia messaggio"}
      </button>
    </div>
  );
}
