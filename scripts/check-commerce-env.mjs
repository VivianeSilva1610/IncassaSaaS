const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "ADMIN_EMAILS",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_COMERCIO_SAAS",
  "CRON_SECRET",
  "HEALTHCHECK_SECRET",
];

const recommended = [
  "STRIPE_PRICE_ADDON_MODULOS_RESTAURANTE",
  "STRIPE_PRICE_ADDON_EQUIPE_RESTAURANTE",
  "STRIPE_PRICE_ADDON_ABAS_RESTAURANTE",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
];

const value = name => (process.env[name] ?? "").trim();
const missing = required.filter(name => !value(name));
const warnings = recommended.filter(name => !value(name));
const invalid = [];

for (const name of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]) {
  if (!value(name)) continue;
  try {
    const url = new URL(value(name));
    if (!['http:', 'https:'].includes(url.protocol)) invalid.push(`${name} deve usar HTTP ou HTTPS`);
  } catch {
    invalid.push(`${name} não contém uma URL válida`);
  }
}

if (value("STRIPE_PRICE_COMERCIO_SAAS") && !value("STRIPE_PRICE_COMERCIO_SAAS").startsWith("price_")) {
  invalid.push("STRIPE_PRICE_COMERCIO_SAAS deve ser um Price ID iniciado por price_");
}
if (value("ADMIN_EMAILS") && !value("ADMIN_EMAILS").toLowerCase().split(",").map(email => email.trim()).includes("viroedu@gmail.com")) {
  invalid.push("ADMIN_EMAILS precisa incluir viroedu@gmail.com");
}
for (const name of ["CRON_SECRET", "HEALTHCHECK_SECRET"]) {
  if (value(name) && value(name).length < 24) invalid.push(`${name} deve possuir pelo menos 24 caracteres`);
}

console.log(`Variáveis obrigatórias configuradas: ${required.length - missing.length}/${required.length}`);
if (missing.length) console.error(`Ausentes: ${missing.join(", ")}`);
if (warnings.length) console.warn(`Recomendadas pendentes: ${warnings.join(", ")}`);
if (invalid.length) console.error(`Configurações inválidas: ${invalid.join("; ")}`);

if (missing.length || invalid.length) process.exitCode = 1;
else console.log("Configuração essencial do INCASSA Comércio aprovada.");
