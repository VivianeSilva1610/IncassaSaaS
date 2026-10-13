"use client";
import { useEffect, useState } from "react";

export function CommerceAbaGate() {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    let id=sessionStorage.getItem("incassa_comercio_aba_id"); if(!id){id=crypto.randomUUID();sessionStorage.setItem("incassa_comercio_aba_id",id);}
    let active=true; const ping=async()=>{try{const response=await fetch("/api/comercio/abas/heartbeat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({abaId:id})});if(response.ok&&active)setBlocked(((await response.json()) as {bloqueado:boolean}).bloqueado);}catch{}};
    void ping(); const timer=setInterval(ping,20000); return()=>{active=false;clearInterval(timer);navigator.sendBeacon?.("/api/comercio/abas/liberar",new Blob([JSON.stringify({abaId:id})],{type:"application/json"}));};
  },[]);
  if(!blocked)return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-stone-950/80 p-4"><div className="max-w-sm rounded-2xl bg-white p-6 text-center"><h2 className="text-lg font-bold">Limite de abas atingido</h2><p className="mt-2 text-sm text-stone-600">Seu plano permite até 3 abas simultâneas por pessoa. Feche outra aba ou contrate o complemento de abas ilimitadas.</p><a href="/comercio/plano" className="mt-4 inline-block rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white">Ver meu plano</a></div></div>;
}
