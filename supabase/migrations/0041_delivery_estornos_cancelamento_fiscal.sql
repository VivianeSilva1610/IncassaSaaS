-- Rastreabilidade de estornos financeiros e do cancelamento fiscal.
-- O recebimento original nunca e apagado: valor_estornado permite apurar
-- caixa liquido, enquanto os eventos preservam quando e por que mudou.

alter table del_orders add column if not exists valor_estornado numeric(10, 2) not null default 0;
alter table del_orders add column if not exists estorno_status text;
alter table del_orders add column if not exists estornado_em timestamptz;

alter table del_orders drop constraint if exists del_orders_valor_estornado_check;
alter table del_orders add constraint del_orders_valor_estornado_check
  check (valor_estornado >= 0 and valor_estornado <= coalesce(valor_pago, totale));

alter table del_orders drop constraint if exists del_orders_estorno_status_check;
alter table del_orders add constraint del_orders_estorno_status_check
  check (estorno_status is null or estorno_status in ('em_processamento', 'parcial', 'total', 'negado'));

alter table del_notas_fiscais add column if not exists cancelamento_solicitado_em timestamptz;
alter table del_notas_fiscais add column if not exists cancelada_em timestamptz;
alter table del_notas_fiscais add column if not exists justificativa_cancelamento text;
alter table del_notas_fiscais add column if not exists protocolo_cancelamento text;
alter table del_notas_fiscais add column if not exists cancelamento_erro text;

create table if not exists del_pagamento_eventos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references del_orders(id) on delete cascade,
  nota_id uuid references del_notas_fiscais(id) on delete set null,
  provedor text not null,
  provedor_evento_id text not null,
  provedor_pagamento_id text,
  tipo text not null,
  status text not null check (status in ('em_processamento', 'confirmado', 'negado')),
  valor_acumulado numeric(10, 2) not null default 0 check (valor_acumulado >= 0),
  valor_movimento numeric(10, 2) not null default 0 check (valor_movimento >= 0),
  ocorrido_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provedor, provedor_evento_id)
);

alter table del_pagamento_eventos enable row level security;
create policy "del_owner_only" on del_pagamento_eventos for select
  using (owner_id in (select public.del_effective_owner_ids()));

create index if not exists del_pagamento_eventos_owner_data_idx
  on del_pagamento_eventos (owner_id, ocorrido_em desc);
create index if not exists del_pagamento_eventos_order_idx
  on del_pagamento_eventos (order_id, ocorrido_em desc);
create index if not exists del_orders_asaas_payment_idx
  on del_orders (asaas_payment_id) where asaas_payment_id is not null;

-- Processa cada webhook uma unica vez e calcula o movimento financeiro como
-- diferenca do total acumulado informado pelo Asaas. A funcao e exclusiva da
-- service role usada pelo webhook; usuarios comuns nao podem chama-la.
create or replace function public.del_registrar_estorno_asaas(
  p_evento_id text,
  p_pagamento_id text,
  p_tipo text,
  p_status text,
  p_valor_acumulado numeric,
  p_ocorrido_em timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order del_orders%rowtype;
  v_nota_id uuid;
  v_novo_total numeric(10, 2);
  v_movimento numeric(10, 2);
begin
  if p_status not in ('em_processamento', 'confirmado', 'negado') then
    raise exception 'Status de estorno invalido';
  end if;

  select * into v_order
  from del_orders
  where asaas_payment_id = p_pagamento_id
  for update;

  if not found then return false; end if;

  if exists (
    select 1 from del_pagamento_eventos
    where provedor = 'asaas' and provedor_evento_id = p_evento_id
  ) then return true; end if;

  select id into v_nota_id
  from del_notas_fiscais
  where owner_id = v_order.owner_id and order_id = v_order.id
  order by created_at desc
  limit 1;

  v_novo_total := least(
    greatest(coalesce(p_valor_acumulado, 0), 0),
    coalesce(v_order.valor_pago, v_order.totale)
  );
  v_movimento := case when p_status = 'confirmado'
    then greatest(v_novo_total - coalesce(v_order.valor_estornado, 0), 0)
    else 0 end;

  insert into del_pagamento_eventos (
    owner_id, order_id, nota_id, provedor, provedor_evento_id,
    provedor_pagamento_id, tipo, status, valor_acumulado,
    valor_movimento, ocorrido_em
  ) values (
    v_order.owner_id, v_order.id, v_nota_id, 'asaas', p_evento_id,
    p_pagamento_id, p_tipo, p_status, v_novo_total,
    v_movimento, coalesce(p_ocorrido_em, now())
  );

  if p_status = 'confirmado' then
    update del_orders
    set valor_estornado = greatest(valor_estornado, v_novo_total),
        estorno_status = case
          when v_novo_total >= coalesce(valor_pago, totale) then 'total'
          else 'parcial'
        end,
        estornado_em = coalesce(p_ocorrido_em, now()),
        status = case
          when competencia_em is null and v_novo_total >= coalesce(valor_pago, totale)
            then 'cancelado'
          else status
        end
    where id = v_order.id;
  else
    update del_orders
    set estorno_status = case when valor_estornado > 0 then estorno_status else p_status end
    where id = v_order.id;
  end if;

  return true;
end;
$$;

revoke all on function public.del_registrar_estorno_asaas(text, text, text, text, numeric, timestamptz) from public;
grant execute on function public.del_registrar_estorno_asaas(text, text, text, text, numeric, timestamptz) to service_role;
