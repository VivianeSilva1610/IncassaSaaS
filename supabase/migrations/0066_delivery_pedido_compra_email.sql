alter table del_fornecedores add column if not exists email text;

alter table del_pedidos_compra
  add column if not exists enviado_email_para text,
  add column if not exists enviado_email_em timestamptz,
  add column if not exists enviado_email_por uuid references auth.users(id);

