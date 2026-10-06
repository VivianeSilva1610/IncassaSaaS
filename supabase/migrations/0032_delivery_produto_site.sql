-- Controle de visibilidade no site público (Pranzo): alguns pratos só são
-- vendidos em dias específicos, então o toggle "ativo" (usado também no
-- PDV/Monte seu Pranzo) não basta — precisa de um controle próprio do site.
alter table del_products add column if not exists visivel_site boolean not null default true;
-- dias da semana em que o item aparece no site (0=domingo..6=sábado, igual
-- à convenção já usada em del_cardapio_semana). Null ou vazio = todos os dias.
alter table del_products add column if not exists dias_site smallint[];
