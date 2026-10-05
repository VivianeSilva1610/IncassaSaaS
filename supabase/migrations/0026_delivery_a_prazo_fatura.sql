-- Orders paid "a prazo" (on credit, not at delivery time) can generate an
-- INCASSA invoice so Viviane can collect later through the existing
-- Fatture/sollecito flow. Deliberately NOT a hard dependency: a_prazo
-- defaults to false and invoice_id stays null for every order that
-- doesn't use this — a restaurant tenant without an INCASSA account is
-- unaffected either way.

alter table del_orders add column if not exists a_prazo boolean not null default false;
alter table del_orders add column if not exists invoice_id uuid references invoices(id) on delete set null;
