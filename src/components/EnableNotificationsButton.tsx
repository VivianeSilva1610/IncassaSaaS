"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/locale";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Status = "idle" | "loading" | "enabled" | "denied" | "unsupported" | "error";

function isIosNotInstalled(): boolean {
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIos && !isStandalone;
}

const strings = {
  it: {
    unAttimo: "Un attimo…",
    attivaNotifiche: "Attiva notifiche",
    permessoNegato: "Permesso negato. Abilita le notifiche per questo sito nelle impostazioni del browser.",
    qualcosaAndato: "Qualcosa è andato storto.",
    nonSupportate: "Il tuo browser non supporta le notifiche push.",
    attive: "✓ Notifiche attive su questo dispositivo",
  },
  en: {
    unAttimo: "One moment…",
    attivaNotifiche: "Enable notifications",
    permessoNegato: "Permission denied. Enable notifications for this site in your browser settings.",
    qualcosaAndato: "Something went wrong.",
    nonSupportate: "Your browser doesn't support push notifications.",
    attive: "✓ Notifications enabled on this device",
  },
};

export function EnableNotificationsButton({ locale = "it" }: { locale?: Locale }) {
  const t = strings[locale];
  const [status, setStatus] = useState<Status>("idle");
  const [iosNotInstalled, setIosNotInstalled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) {
          setIosNotInstalled(isIosNotInstalled());
          setStatus("unsupported");
        }
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!cancelled && subscription) setStatus("enabled");
    }

    checkSupport().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleClick() {
    setStatus("loading");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("enabled");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    if (iosNotInstalled) {
      return locale === "en" ? (
        <p className="text-sm text-stone-500">
          On iPhone, notifications only work if you add INCASSA to your Home Screen: tap{" "}
          <span className="font-medium">Share</span> in your browser →{" "}
          <span className="font-medium">&quot;Add to Home Screen&quot;</span>, then open the app from
          there and try again.
        </p>
      ) : (
        <p className="text-sm text-stone-500">
          Su iPhone le notifiche funzionano solo se aggiungi INCASSA alla schermata Home: tocca{" "}
          <span className="font-medium">Condividi</span> nel browser →{" "}
          <span className="font-medium">&quot;Aggiungi a Home&quot;</span>, poi apri l&apos;app da lì e
          riprova.
        </p>
      );
    }
    return <p className="text-sm text-stone-400">{t.nonSupportate}</p>;
  }

  if (status === "enabled") {
    return <p className="text-sm text-emerald-700">{t.attive}</p>;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
      >
        {status === "loading" ? t.unAttimo : t.attivaNotifiche}
      </button>
      {status === "denied" && <p className="mt-2 text-sm text-red-600">{t.permessoNegato}</p>}
      {status === "error" && <p className="mt-2 text-sm text-red-600">{t.qualcosaAndato}</p>}
    </div>
  );
}
