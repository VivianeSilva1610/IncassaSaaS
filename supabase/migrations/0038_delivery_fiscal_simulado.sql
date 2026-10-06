-- Permite escolher "simulado" como provedor: emite notas falsas (chave de
-- acesso marcada como SIMULACAO-...) só pra testar o fluxo de ponta a
-- ponta (Vendas → Fiscal → cancelar) antes de existir IE + certificado +
-- provedor real contratado. Nunca é um documento fiscal válido.
alter table del_fiscal_config drop constraint if exists del_fiscal_config_provedor_check;
alter table del_fiscal_config add constraint del_fiscal_config_provedor_check
  check (provedor is null or provedor in ('simulado', 'focus_nfe', 'plugnotas', 'enotas'));
