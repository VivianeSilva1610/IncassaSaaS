"use client";

import { useState } from "react";
import type { Tone } from "@/content/kit-incassa";
import { toneEmoji, toneBadgeClasses, toneBorderClasses } from "@/lib/tone-styles";

export function MessageCard({ text, tone }: { text: string; tone?: Tone }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className={`rounded-xl border-l-4 border-y border-r border-y-stone-200 border-r-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        tone ? toneBorderClasses[tone] : "border-l-stone-300"
      }`}
    >
      {tone && (
        <span
          className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${toneBadgeClasses[tone]}`}
        >
          {toneEmoji[tone]} {tone}
        </span>
      )}
      <p className="whitespace-pre-wrap text-sm text-stone-800">{text}</p>
      <button
        onClick={handleCopy}
        className="mt-3 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:bg-stone-700 active:scale-95"
      >
        {copied ? "Copiato!" : "Copia messaggio"}
      </button>
    </div>
  );
}
