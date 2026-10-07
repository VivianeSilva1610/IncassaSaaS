"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function CadastroRestaurantePage() {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [disponibilidade, setDisponibilidade] = useState<"checando" | "disponivel" | "indisponivel" | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleNomeChange(valor: string) {
    setNome(valor);
    if (!slugEditadoManualmente) {
      const novoSlug = slugify(valor);
      setSlug(novoSlug);
      setDisponibilidade(novoSlug ? "checando" : null);
    }
  }

  function handleSlugChange(valor: string) {
    setSlugEditadoManualmente(true);
    const novoSlug = slugify(valor);
    setSlug(novoSlug);
    setDisponibilidade(novoSlug ? "checando" : null);
  }

  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/restaurante-signup/slug-disponivel?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        setDisponibilidade(data.disponivel ? "disponivel" : "indisponivel");
      } catch {
        setDisponibilidade(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  const podeEnviar = aceitaTermos && disponibilidade === "disponivel" && nome.trim() && email && password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;
    setStatus("sending");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/ativar-restaurante`,
        data: {
          locale: "pt-BR",
          restaurant_signup: true,
          restaurant_name: nome.trim(),
          restaurant_slug: slug,
          termini_accettati: true,
          consenso_registrato_il: new Date().toISOString(),
        },
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Cadastre seu restaurante</h1>
      <p className="mt-2 text-sm text-stone-600">Crie sua loja própria no INCASSA Restaurante.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Confira seu e-mail ({email}, inclusive spam) e clique no link para confirmar a conta. Depois disso
          você já pode ativar a assinatura e começar a usar.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            required
            value={nome}
            onChange={(e) => handleNomeChange(e.target.value)}
            placeholder="Nome do restaurante"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <div>
            <div className="flex items-center rounded-md border border-stone-300 px-3 py-2 text-sm focus-within:border-amber-500">
              <span className="text-stone-400">incassa.eu/loja/</span>
              <input
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
            {disponibilidade === "checando" && <p className="mt-1 text-xs text-stone-400">Verificando…</p>}
            {disponibilidade === "disponivel" && <p className="mt-1 text-xs text-emerald-700">Disponível ✓</p>}
            {disponibilidade === "indisponivel" && <p className="mt-1 text-xs text-red-600">Já está em uso, escolha outro.</p>}
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mínimo 6 caracteres)"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />

          <label className="flex items-start gap-2 text-xs text-stone-700">
            <input
              type="checkbox"
              required
              checked={aceitaTermos}
              onChange={(e) => setAceitaTermos(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Li e aceito os{" "}
              <Link href="/termini" target="_blank" className="text-amber-700 underline underline-offset-2">
                Termos de Serviço
              </Link>{" "}
              e a{" "}
              <Link href="/privacy" target="_blank" className="text-amber-700 underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "sending" || !podeEnviar}
            className="w-full rounded-lg bg-gradient-to-b from-amber-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] disabled:opacity-60"
          >
            {status === "sending" ? "Um momento…" : "Criar conta"}
          </button>
          {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
      )}

      <p className="mt-4 text-xs text-stone-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-amber-700 underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </main>
  );
}
