-- Personalização visual por restaurante (logo, foto de capa, cor da marca).
-- Até aqui a vitrine pública (/loja/[slug]) só tinha a cara fixa do Pranzo
-- pra "pranzo" e um template genérico sem nenhuma identidade pra qualquer
-- outro slug — pendência registrada desde a Fase 0 do plano multi-tenant.
-- Mesma convenção já usada em del_products.imagem_url: a URL é colada
-- (hospedada em outro lugar), não um upload pra nosso storage.
alter table restaurants add column if not exists logo_url text;
alter table restaurants add column if not exists capa_url text;
alter table restaurants add column if not exists cor_primaria text
  check (cor_primaria is null or cor_primaria ~ '^#[0-9a-fA-F]{6}$');
