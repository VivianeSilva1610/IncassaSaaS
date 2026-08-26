"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/app/actions";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="text-sm font-medium text-red-600 hover:underline">
        Elimina account e tutti i dati
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">
        Questa azione è irreversibile: verranno eliminati il tuo account, l&apos;abbonamento e tutti i
        clienti, le fatture e i preventivi salvati.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => startTransition(() => deleteAccount())}
          disabled={pending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60"
        >
          {pending ? "Eliminazione…" : "Sì, elimina tutto"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-300"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
