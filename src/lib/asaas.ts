const ASAAS_BASE_URL = "https://api.asaas.com/v3";

// A chave de API é por restaurante (restaurant_payment_providers) — nunca
// mais um único .env compartilhado por todos os tenants. Quem chama estas
// funções é responsável por buscar a chave do restaurante certo antes.
async function asaasRequest<T>(apiKey: string, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
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
  apiKey: string;
  name: string;
  cpfCnpj: string;
  phone?: string | null;
}): Promise<string> {
  const cpfCnpjLimpo = params.cpfCnpj.replace(/\D/g, "");

  const existing = await asaasRequest<{ data: { id: string }[] }>(
    params.apiKey,
    `/customers?cpfCnpj=${cpfCnpjLimpo}`,
  );
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const created = await asaasRequest<{ id: string }>(params.apiKey, "/customers", {
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
  apiKey: string;
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
}): Promise<{ id: string }> {
  const dueDate = new Date().toISOString().slice(0, 10);

  return asaasRequest<{ id: string }>(params.apiKey, "/payments", {
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

export async function getAsaasPixQrCode(apiKey: string, paymentId: string): Promise<{
  encodedImage: string;
  payload: string;
  expirationDate: string;
}> {
  return asaasRequest(apiKey, `/payments/${paymentId}/pixQrCode`);
}

// Solicita o estorno à Asaas. A confirmação de verdade (dinheiro realmente
// devolvido) chega depois via webhook (PAYMENT_REFUNDED/PARTIALLY_REFUNDED),
// que é quem atualiza del_orders — esta chamada só dispara o pedido.
export async function refundAsaasPayment(params: {
  apiKey: string;
  paymentId: string;
  value?: number;
  description?: string;
}): Promise<{ id: string; status: string }> {
  return asaasRequest(params.apiKey, `/payments/${params.paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify({
      value: params.value,
      description: params.description,
    }),
  });
}
