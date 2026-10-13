-- Indicadores gerenciais por competência: margem, saída líquida, giro e curva ABC.
-- Não representam caixa, lucro líquido ou apuração fiscal.

create index if not exists commerce_sales_competencia_idx
  on commerce_sales(business_id,competencia_em) where status in('concluida','devolvida_parcial','devolvida');
create index if not exists commerce_sale_returns_business_date_idx
  on commerce_sale_returns(business_id,created_at);

create function commerce_relatorio_produtos(p_inicio date,p_fim date)
returns table(product_id uuid,variant_id uuid,produto text,sku text,quantidade_liquida numeric,receita_liquida numeric,cmv_liquido numeric,margem_bruta numeric,margem_percentual numeric,estoque_atual numeric,giro_periodo numeric,classe_abc text)
language sql stable security invoker set search_path=public as $$
with movimentos as (
  select i.product_id,i.variant_id,sum(i.quantidade)::numeric quantidade,
    sum(i.total)::numeric receita,sum(i.quantidade*i.custo_unitario_snapshot)::numeric cmv
  from commerce_sale_items i join commerce_sales s on s.id=i.sale_id
  where s.owner_id=commerce_owner_atual() and s.status in('concluida','devolvida_parcial','devolvida')
    and s.competencia_em>=p_inicio::timestamptz and s.competencia_em<(p_fim+1)::timestamptz
  group by i.product_id,i.variant_id
  union all
  select ri.product_id,si.variant_id,-sum(ri.quantidade)::numeric,
    -sum(ri.valor)::numeric,-sum(ri.quantidade*si.custo_unitario_snapshot)::numeric
  from commerce_sale_return_items ri join commerce_sale_returns r on r.id=ri.return_id join commerce_sale_items si on si.id=ri.sale_item_id
  where r.owner_id=commerce_owner_atual() and r.created_at>=p_inicio::timestamptz and r.created_at<(p_fim+1)::timestamptz
  group by ri.product_id,si.variant_id
), agregado as (
  select product_id,variant_id,sum(quantidade) quantidade,sum(receita) receita,sum(cmv) cmv from movimentos group by product_id,variant_id
), base as (
  select a.*,p.nome||case when v.id is not null then ' · '||v.nome else '' end produto,
    coalesce(v.sku,p.sku) sku,case when v.id is null then p.estoque_atual else v.estoque_atual end estoque,
    sum(greatest(a.receita,0)) over() total_receita,
    sum(greatest(a.receita,0)) over(order by a.receita desc,a.product_id,a.variant_id nulls first) acumulado
  from agregado a join commerce_products p on p.id=a.product_id left join commerce_product_variants v on v.id=a.variant_id
  where p.owner_id=commerce_owner_atual()
)
select product_id,variant_id,produto,sku,round(quantidade,4),round(receita,2),round(cmv,2),round(receita-cmv,2),
  case when receita=0 then 0 else round((receita-cmv)*100/receita,2) end,round(estoque,4),
  case when estoque<=0 then null else round(quantidade/estoque,4) end,
  case when total_receita<=0 then 'C' when (acumulado-greatest(receita,0))/total_receita<0.80 then 'A' when (acumulado-greatest(receita,0))/total_receita<0.95 then 'B' else 'C' end
from base order by receita desc,produto;
$$;

revoke all on function commerce_relatorio_produtos(date,date) from public,anon;
grant execute on function commerce_relatorio_produtos(date,date) to authenticated;
