# Kit Incassa

Landing page + checkout + entrega do **Kit Incassa** (€9): 37 mensagens prontas em italiano para artigiani cobrarem clientes atrasados. Fase 1 do produto INCASSA (veja `C:\Users\vivia\.claude\plans\cozy-dancing-marble.md` para o plano completo e o roadmap das próximas fases).

## Stack

Next.js (App Router, TypeScript, Tailwind) + Stripe Checkout + Supabase (registro de compras) + Resend (envio de e-mail).

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local   # preencha as chaves
npm run dev
```

## Variáveis de ambiente

Veja `.env.local.example`. Resumo:

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — conta Stripe (modo teste para desenvolvimento).
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — projeto Supabase (a **secret key**, não a publishable/anon).
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — conta Resend para envio do kit por e-mail.
- `NEXT_PUBLIC_SITE_URL` — URL pública do site (usada nos redirects do Stripe e nos links do e-mail).

## Fluxo

1. `/` — landing page, botão de compra chama `POST /api/checkout` e redireciona para o Stripe.
2. Stripe redireciona para `/acesso?session_id=...` após o pagamento.
3. `POST /api/webhooks/stripe` grava a compra no Supabase (tabela `purchases`) e envia o e-mail com o kit via Resend.
4. `/acesso` valida o `session_id` direto na API do Stripe (sem login) e mostra as 37 mensagens + link de download (`/api/download`).

## Testando o pagamento

Modo teste do Stripe: cartão `4242 4242 4242 4242`, qualquer CVC/data futura. Para testar o webhook localmente, use o [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
