"use client";
import { useState } from "react";

export function CommerceSubscribeButton({className}:{className?:string}){
  const[loading,setLoading]=useState(false);const[error,setError]=useState<string|null>(null);
  async function subscribe(){setLoading(true);setError(null);try{const response=await fetch("/api/subscribe-comercio",{method:"POST"});const data=await response.json();if(data.url)window.location.href=data.url;else{setError(data.error??"Não foi possível iniciar a assinatura.");setLoading(false);}}catch{setError("Não foi possível iniciar a assinatura.");setLoading(false);}}
  return <div><button type="button" onClick={subscribe} disabled={loading} className={className}>{loading?"Um momento…":"Ativar assinatura (7 dias grátis)"}</button>{error&&<p className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}
