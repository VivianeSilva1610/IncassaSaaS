-- Preserva os itens e a classificação fiscal usados em cada tentativa de
-- NFC-e. O cadastro do produto pode mudar depois da venda; o contador precisa
-- receber o retrato histórico da emissão, não os valores atuais do produto.

alter table del_notas_fiscais
  add column if not exists itens_snapshot jsonb not null default '[]'::jsonb;

alter table del_notas_fiscais
  drop constraint if exists del_notas_fiscais_itens_snapshot_array_check;

alter table del_notas_fiscais
  add constraint del_notas_fiscais_itens_snapshot_array_check
  check (jsonb_typeof(itens_snapshot) = 'array');

comment on column del_notas_fiscais.itens_snapshot is
  'Itens e classificação fiscal capturados no momento da tentativa de emissão.';
