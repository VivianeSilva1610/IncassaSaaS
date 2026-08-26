"use client";

import { useEffect, useState } from "react";

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

export function EnableNotificationsButton() {
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
      return (
        <p className="text-sm text-stone-500">
          Su iPhone le notifiche funzionano solo se aggiungi INCASSA alla schermata Home: tocca{" "}
          <span className="font-medium">Condividi</span> nel browser →{" "}
          <span className="font-medium">&quot;Aggiungi a Home&quot;</span>, poi apri l&apos;app da lì e
          riprova.
        </p>
      );
    }
    return <p className="text-sm text-stone-400">Il tuo browser non supporta le notifiche push.</p>;
  }

  if (status === "enabled") {
    return <p className="text-sm text-emerald-700">✓ Notifiche attive su questo dispositivo</p>;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
      >
        {status === "loading" ? "Un attimo…" : "Attiva notifiche"}
      </button>
      {status === "denied" && (
        <p className="mt-2 text-sm text-red-600">
          Permesso negato. Abilita le notifiche per questo sito nelle impostazioni del browser.
        </p>
      )}
      {status === "error" && <p className="mt-2 text-sm text-red-600">Qualcosa è andato storto.</p>}
    </div>
  );
}
