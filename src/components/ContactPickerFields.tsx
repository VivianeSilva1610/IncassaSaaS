"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/locale";

interface ContactPickerContact {
  name?: string[];
  tel?: string[];
}

interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<ContactPickerContact[]>;
}

const strings = {
  it: {
    nome: "Nome",
    sceglieDaRubrica: "Scegli dalla rubrica",
    telefono: "Telefono (per WhatsApp)",
  },
  en: {
    nome: "Name",
    sceglieDaRubrica: "Choose from contacts",
    telefono: "Phone (for WhatsApp)",
  },
};

export function ContactPickerFields({ locale = "it" }: { locale?: Locale }) {
  const t = strings[locale];
  const nomeRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setSupported(typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window);
    });
  }, []);

  async function handlePick() {
    try {
      const contactsApi = (navigator as unknown as { contacts: ContactsManager }).contacts;
      const contacts = await contactsApi.select(["name", "tel"], { multiple: false });
      const contact = contacts[0];
      if (!contact) return;

      if (nomeRef.current && contact.name?.[0]) {
        nomeRef.current.value = contact.name[0];
      }
      if (telefonoRef.current && contact.tel?.[0]) {
        telefonoRef.current.value = contact.tel[0];
      }
    } catch (err) {
      console.error("Contact picker failed:", err);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <input
          ref={nomeRef}
          name="nome"
          required
          placeholder={t.nome}
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        {supported && (
          <button
            type="button"
            onClick={handlePick}
            title={t.sceglieDaRubrica}
            aria-label={t.sceglieDaRubrica}
            className="shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50"
          >
            📇
          </button>
        )}
      </div>
      <input
        ref={telefonoRef}
        name="telefono"
        placeholder={t.telefono}
        className="rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
    </>
  );
}
