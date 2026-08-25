import type { Tone } from "@/content/kit-incassa";

export const toneEmoji: Record<Tone, string> = {
  Gentile: "😊",
  Cordiale: "🙂",
  Diretto: "😐",
  Formale: "⚠️",
};

export const toneBadgeClasses: Record<Tone, string> = {
  Gentile: "bg-emerald-100 text-emerald-700",
  Cordiale: "bg-sky-100 text-sky-700",
  Diretto: "bg-amber-100 text-amber-800",
  Formale: "bg-stone-200 text-stone-700",
};

export const toneBorderClasses: Record<Tone, string> = {
  Gentile: "border-emerald-300",
  Cordiale: "border-sky-300",
  Diretto: "border-amber-300",
  Formale: "border-stone-300",
};
