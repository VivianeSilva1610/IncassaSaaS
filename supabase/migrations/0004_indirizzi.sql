alter table clients add column if not exists indirizzo text;
alter table invoices add column if not exists luogo_lavoro text;
alter table quotes add column if not exists luogo_lavoro text;
