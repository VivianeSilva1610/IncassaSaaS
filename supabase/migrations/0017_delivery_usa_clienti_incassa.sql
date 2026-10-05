-- Viviane decided to reuse INCASSA's own client list (the "Clienti" page,
-- table `clients`) for her delivery business too, instead of a separate
-- del_customers table — it's the same person on both sides, so there's no
-- real multi-tenant isolation concern here (RLS on `clients` already scopes
-- rows to `user_id = auth.uid()`, which for her own orders is always her).
-- del_customers was schema-only, never wired into any screen, so it's
-- removed rather than kept as unused cruft.

alter table del_orders drop column if exists customer_id;
drop table if exists del_customers;

alter table del_orders add column if not exists cliente_id uuid references clients(id) on delete set null;
