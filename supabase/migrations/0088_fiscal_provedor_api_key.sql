-- Cada restaurante contrata e informa seu próprio provedor de emissão
-- fiscal (Focus NFe/PlugNotas/eNotas no Brasil, equivalente na Itália) —
-- mesmo princípio já usado em restaurant_payment_providers: a credencial é
-- de cada cliente, nunca compartilhada. A correção dos dados fiscais
-- informados (alíquota, regime, classificação) é responsabilidade de quem
-- informa — o sistema não valida nem se responsabiliza pelo valor
-- calculado a partir de dado incorreto.
--
-- Guarda só a credencial. A classe de integração real por provedor
-- (FocusNfeProvider etc.) continua não implementada — não existe conta de
-- teste pra validar contra a API de verdade ainda, então nenhum provedor
-- real emite nota de verdade por enquanto (getFiscalProvider segue
-- recusando até alguém implementar e testar a classe correspondente).
alter table del_fiscal_config add column if not exists provedor_api_key text;
alter table restaurant_fiscal_it add column if not exists provedor_api_key text;
