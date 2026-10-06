const ASAAS_BASE_URL = "https://api.asaas.com/v3";

async function asaasRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ASAAS_API_KEY!,
      "User-Agent": "INCASSA-Pranzo",
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.errors?.[0]?.description ?? `Erro Asaas (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function findOrCreateAsaasCustomer(params: {
  name: string;
  cpfCnpj: string;
  phone?: string | null;
}): Promise<string> {
  const cpfCnpjLimpo = params.cpfCnpj.replace(/\D/g, "");

  const existing = await asaasRequest<{ data: { id: string }[] }>(
    `/customers?cpfCnpj=${cpfCnpjLimpo}`,
  );
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const created = await asaasRequest<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      cpfCnpj: cpfCnpjLimpo,
      mobilePhone: params.phone ?? undefined,
    }),
  });
  return created.id;
}

export async function createAsaasPixPayment(params: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
}): Promise<{ id: string }> {
  const dueDate = new Date().toISOString().slice(0, 10);

  return asaasRequest<{ id: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "PIX",
      value: params.value,
      dueDate,
      description: params.description,
      externalReference: params.externalReference,
    }),
  });
}

export async function getAsaasPixQrCode(paymentId: string): Promise<{
  encodedImage: string;
  payload: string;
  expirationDate: string;
}> {
  return asaasRequest(`/payments/${paymentId}/pixQrCode`);
}
