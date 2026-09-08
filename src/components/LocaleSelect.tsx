"use client";

import { useState, useTransition } from "react";
import { updateLocale } from "@/app/app/actions";

export function LocaleSelect({ initialLocale }: { initialLocale: "it" | "en" }) {
  const [locale, setLocale] = useState(initialLocale);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as "it" | "en";
    setLocale(next);
    startTransition(async () => {
      await updateLocale(next);
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-60"
    >
      <option value="it">🇮🇹 Italiano</option>
      <option value="en">🇺🇸 English</option>
    </select>
  );
}
