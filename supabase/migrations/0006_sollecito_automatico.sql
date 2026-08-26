alter table invoices add column if not exists sollecito_auto_inviato_il timestamptz;
alter table profiles add column if not exists sollecito_automatico_attivo boolean not null default false;
