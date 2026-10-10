"use client";

import { useState } from "react";

export function PaymentProviderForm({
  action,
  provedorAtual,
  ativoAtual,
  asaasKeyLabel,
  stripeKeyLabel,
  asaasKeyAtual,
  stripeKeyAtual,
  deixarEmBranco,
  provedorLabel,
  provedorAsaas,
  provedorStripe,
  ativarRecebimento,
  salvar,
}: {
  action: (formData: FormData) => void;
  provedorAtual: string;
  ativoAtual: boolean;
  asaasKeyLabel: string;
  stripeKeyLabel: string;
  asaasKeyAtual: boolean;
  stripeKeyAtual: boolean;
  deixarEmBranco: string;
  provedorLabel: string;
  provedorAsaas: string;
  provedorStripe: string;
  ativarRecebimento: string;
  salvar: string;
}) {
  const [provedor, setProvedor] = useState(provedorAtual === "stripe" ? "stripe" : "asaas");

  return (
    <form action={action} className="mt-3 grid gap-3">
      <div>
        <span className="mb-1 block text-xs text-stone-500">{provedorLabel}</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="radio"
              name="provedor"
              value="asaas"
              checked={provedor === "asaas"}
              onChange={() => setProvedor("asaas")}
            />
            {provedorAsaas}
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="radio"
              name="provedor"
              value="stripe"
              checked={provedor === "stripe"}
              onChange={() => setProvedor("stripe")}
            />
            {provedorStripe}
          </label>
        </div>
      </div>

      {provedor === "asaas" && (
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{asaasKeyLabel}</span>
          <input
            name="asaas_api_key"
            type="password"
            placeholder={asaasKeyAtual ? deixarEmBranco : "$aact_..."}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      )}

      {provedor === "stripe" && (
        <label className="text-sm text-stone-600">
          <span className="mb-1 block text-xs text-stone-500">{stripeKeyLabel}</span>
          <input
            name="stripe_secret_key"
            type="password"
            placeholder={stripeKeyAtual ? deixarEmBranco : "sk_live_..."}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      )}

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="ativo" defaultChecked={ativoAtual} />
        {ativarRecebimento}
      </label>
      <button type="submit" className="w-fit rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
        {salvar}
      </button>
    </form>
  );
}
