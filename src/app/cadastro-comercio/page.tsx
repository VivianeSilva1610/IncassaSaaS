"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function CadastroComercioPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/ativar-comercio`,
        data: { locale: "pt-BR", selected_product: "comercio", termini_accettati: true, comercio_beta_ciente: true, consenso_registrato_il: new Date().toISOString() },
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">INCASSA Comércio</p>
    <h1 className="mt-2 text-2xl font-bold">Criar conta</h1>
    <p className="mt-2 text-sm text-stone-600">Depois de confirmar o e-mail, você ativará a assinatura e cadastrará sua empresa.</p>
    <div role="note" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Versão beta.</strong> Disponível para empresas no Brasil (CNPJ). O INCASSA Comércio está em fase de testes e pode apresentar falhas ou mudanças sem aviso prévio. A emissão fiscal (NF-e/NFC-e) ainda não está ativa — funciona só em homologação, sem validade fiscal. Mantenha um controle paralelo e baixe o backup dos seus dados com frequência.</div>
    {status === "sent" ? <p role="status" className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Confira seu e-mail ({email}) e clique no link de confirmação.</p> : <form onSubmit={submit} className="mt-6 space-y-3">
      <label className="block text-sm font-medium text-stone-700">E-mail
        <input name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="seuemail@exemplo.com" className="mt-1 w-full rounded-xl border p-3 text-sm"/>
      </label>
      <label className="block text-sm font-medium text-stone-700">Senha
        <input name="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} placeholder="Senha (mínimo 6 caracteres)" className="mt-1 w-full rounded-xl border p-3 text-sm"/>
      </label>
      <label className="flex items-start gap-2 text-xs text-stone-600"><input type="checkbox" required checked={terms} onChange={event => setTerms(event.target.checked)} className="mt-0.5"/><span>Li e aceito os <Link href="/pt/termos" target="_blank" className="text-amber-700 underline">Termos de Serviço</Link> e a <Link href="/pt/privacidade" target="_blank" className="text-amber-700 underline">Política de Privacidade</Link>, e estou ciente de que o INCASSA Comércio está em versão beta, sem emissão fiscal ativa.</span></label>
      <button disabled={status === "sending" || !terms} className="w-full rounded-xl bg-stone-900 p-3 text-sm font-semibold text-white disabled:opacity-50">{status === "sending" ? "Um momento…" : "Criar conta Comércio"}</button>
      {error && <p role="alert" aria-live="polite" className="text-sm text-red-600">{error}</p>}
    </form>}
    <p className="mt-5 text-xs text-stone-500"><Link href="/escolher-sistema" className="text-amber-700">← Escolher outro sistema</Link></p>
  </main>;
}
