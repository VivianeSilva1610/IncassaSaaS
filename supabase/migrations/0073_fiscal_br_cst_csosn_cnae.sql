-- Prepara o terreno pro SPED Fiscal/Contribuições (ainda não gerado, mas a
-- infraestrutura de dado já pode existir independente de provedor de emissão
-- contratado — o leiaute do SPED é especificação pública, só a configuração
-- por regime é que depende do cliente/contador).
--
-- CST (regime normal) e CSOSN (Simples Nacional) são mutuamente exclusivos
-- por natureza fiscal, mas ficam como colunas separadas e opcionais — qual
-- delas é relevante depende de del_fiscal_config.regime_tributario, decidido
-- na camada de aplicação (tela de Classificação Fiscal), não por CHECK
-- cruzado aqui. MEI não usa nenhum dos dois pra esse fim.
--
-- Padroniza também o formato de NCM/CFOP/CEST em del_products — hoje são
-- texto livre sem validação, diferente de del_ingredients.ncm (que já valida
-- 8 dígitos desde a 0058). Confirmado antes desta migration: nenhum produto
-- em produção tem NCM/CFOP/CEST que viole esse formato.

alter table del_products add column if not exists cst text;
alter table del_products add column if not exists csosn text;
alter table del_products add column if not exists aliquota_icms numeric(5, 2);

alter table del_products add constraint del_products_cst_formato
  check (cst is null or cst ~ '^\d{2}$');
alter table del_products add constraint del_products_csosn_formato
  check (csosn is null or csosn ~ '^\d{3}$');
alter table del_products add constraint del_products_aliquota_icms_faixa
  check (aliquota_icms is null or (aliquota_icms >= 0 and aliquota_icms <= 100));

alter table del_products add constraint del_products_ncm_formato
  check (ncm is null or ncm = '' or ncm ~ '^\d{8}$');
alter table del_products add constraint del_products_cfop_formato
  check (cfop is null or cfop = '' or cfop ~ '^\d{4}$');
alter table del_products add constraint del_products_cest_formato
  check (cest is null or cest = '' or cest ~ '^\d{7}$');

alter table del_fiscal_config add column if not exists cnae text;
alter table del_fiscal_config add constraint del_fiscal_config_cnae_formato
  check (cnae is null or cnae = '' or cnae ~ '^\d{7}$');
