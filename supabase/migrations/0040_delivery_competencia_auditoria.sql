-- Separa três eventos que não podem ser confundidos na apuração:
-- pedido criado (created_at), venda realizada/competência (competencia_em)
-- e dinheiro recebido/caixa (pago_em). Para o delivery, a entrega é o
-- evento operacional mais confiável para reconhecer que a venda ocorreu.

alter table del_orders add column if not exists competencia_em timestamptz;
alter table del_orders add column if not exists forma_pagamento text;
alter table del_orders add column if not exists valor_pago numeric(10, 2);

alter table del_orders drop constraint if exists del_orders_forma_pagamento_check;
alter table del_orders add constraint del_orders_forma_pagamento_check
  check (forma_pagamento is null or forma_pagamento in (
    'pix', 'dinheiro', 'cartao_debito', 'cartao_credito', 'a_prazo', 'outro'
  ));

alter table del_orders drop constraint if exists del_orders_valor_pago_check;
alter table del_orders add constraint del_orders_valor_pago_check
  check (valor_pago is null or valor_pago >= 0);

-- Histórico: só é possível afirmar competência quando já há evidência de
-- entrega. Não presumir que pedido pago, criado ou pronto foi efetivamente
-- entregue.
update del_orders
set competencia_em = coalesce(entregue_em, created_at)
where status = 'entregue' and competencia_em is null;

update del_orders
set forma_pagamento = 'pix', valor_pago = coalesce(valor_pago, totale)
where canal = 'site' and pago = true and forma_pagamento is null;

update del_orders
set forma_pagamento = 'a_prazo'
where a_prazo = true and forma_pagamento is null;

-- A competência passa a ser registrada no banco, inclusive quando o status
-- for alterado por integrações futuras fora da aplicação Next.js.
create or replace function public.del_set_competencia_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'entregue' and new.competencia_em is null then
    new.competencia_em := coalesce(new.entregue_em, now());
  end if;
  return new;
end;
$$;

drop trigger if exists del_orders_set_competencia_em on del_orders;
create trigger del_orders_set_competencia_em
  before insert or update of status, entregue_em on del_orders
  for each row execute function public.del_set_competencia_em();

-- Emissão automática é opt-in. MEI não deve gerar tentativa/erro para cada
-- venda a pessoa física quando não há obrigação ou provedor configurado.
alter table del_fiscal_config add column if not exists emissao_automatica boolean not null default false;

-- Uma única nota pendente/emitida por pedido, ambiente e modelo. Notas com
-- erro ou canceladas permanecem no histórico e permitem nova tentativa.
create unique index if not exists del_notas_fiscais_ativa_unica_idx
  on del_notas_fiscais (owner_id, order_id, ambiente, modelo)
  where status in ('pendente', 'emitida');

-- Índices alinhados aos fechamentos, RLS, telas operacionais e joins.
create index if not exists del_orders_owner_created_idx
  on del_orders (owner_id, created_at desc);
create index if not exists del_orders_owner_status_created_idx
  on del_orders (owner_id, status, created_at desc);
create index if not exists del_orders_owner_competencia_idx
  on del_orders (owner_id, competencia_em desc)
  where competencia_em is not null and status <> 'cancelado';
create index if not exists del_orders_owner_pago_idx
  on del_orders (owner_id, pago_em desc)
  where pago = true;
create index if not exists del_order_items_order_idx
  on del_order_items (order_id);
create index if not exists del_stock_movements_order_idx
  on del_stock_movements (order_id)
  where order_id is not null;
create index if not exists del_notas_fiscais_owner_created_idx
  on del_notas_fiscais (owner_id, created_at desc);

