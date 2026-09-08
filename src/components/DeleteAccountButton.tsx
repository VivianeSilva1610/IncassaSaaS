"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/app/actions";
import type { Locale } from "@/lib/locale";

const strings = {
  it: {
    elimina: "Elimina account e tutti i dati",
    irreversibile:
      "Questa azione è irreversibile: verranno eliminati il tuo account, l'abbonamento e tutti i " +
      "clienti, le fatture e i preventivi salvati.",
    eliminazione: "Eliminazione…",
    siEliminaTutto: "Sì, elimina tutto",
    annulla: "Annulla",
  },
  en: {
    elimina: "Delete account and all data",
    irreversibile:
      "This action is irreversible: your account, subscription, and all saved clients, invoices " +
      "and quotes will be deleted.",
    eliminazione: "Deleting…",
    siEliminaTutto: "Yes, delete everything",
    annulla: "Cancel",
  },
};

export function DeleteAccountButton({ locale = "it" }: { locale?: Locale }) {
  const t = strings[locale];
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-sm font-medium text-red-600 hover:underline">
        {t.elimina}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">{t.irreversibile}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => startTransition(() => deleteAccount())}
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          {pending ? t.eliminazione : t.siEliminaTutto}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-300"
        >
          {t.annulla}
        </button>
      </div>
    </div>
  );
}
