"use client";

import { useEffect, useRef, useState } from "react";

interface ContactPickerContact {
  name?: string[];
  tel?: string[];
}

interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<ContactPickerContact[]>;
}

export function ContactPickerFields() {
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
          placeholder="Nome"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        {supported && (
          <button
            type="button"
            onClick={handlePick}
            title="Scegli dalla rubrica"
            aria-label="Scegli dalla rubrica"
            className="shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50"
          >
            📇
          </button>
        )}
      </div>
      <input
        ref={telefonoRef}
        name="telefono"
        placeholder="Telefono (per WhatsApp)"
        className="rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
    </>
  );
}
