import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface SendMetaEventParams {
  eventName: string;
  eventId: string;
  email?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  value?: number;
  currency?: string;
}

/** Invia un evento di conversione lato server al Meta Conversions API. */
export async function sendMetaEvent(params: SendMetaEventParams): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) return;

  const userData: Record<string, unknown> = {};
  if (params.email) userData.em = [sha256(params.email)];
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const payload = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        action_source: "website",
        user_data: userData,
        custom_data:
          params.value !== undefined ? { value: params.value, currency: params.currency ?? "EUR" } : undefined,
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Meta CAPI event failed:", await res.text());
    }
  } catch (err) {
    console.error("Failed to send Meta CAPI event:", err);
  }
}
