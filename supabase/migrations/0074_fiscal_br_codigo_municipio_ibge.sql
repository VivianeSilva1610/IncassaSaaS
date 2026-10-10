-- Registro 0000 do SPED EFD-ICMS/IPI exige COD_MUN (código do município no
-- IBGE, 7 dígitos) — del_fiscal_config só tinha o nome do município como
-- texto livre, que não serve pra esse campo.

alter table del_fiscal_config add column if not exists codigo_municipio_ibge text;
alter table del_fiscal_config add constraint del_fiscal_config_codigo_municipio_ibge_formato
  check (codigo_municipio_ibge is null or codigo_municipio_ibge = '' or codigo_municipio_ibge ~ '^\d{7}$');
