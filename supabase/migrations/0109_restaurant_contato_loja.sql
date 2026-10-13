-- Canal de contato (e-mail e WhatsApp) usado no botão "Fazer pedido" e no
-- rodapé da loja pública (/loja/[slug]). Até aqui isso era hardcoded pro
-- contato pessoal da Viviane/Pranzo (viverevivi37@gmail.com e a variável
-- global NEXT_PUBLIC_RESTAURANTE_WHATSAPP) pra QUALQUER restaurante — um
-- tenant novo mandava a mensagem de pedido pro WhatsApp/e-mail dela, não
-- do próprio dono.
alter table restaurants add column if not exists contato_email text;
alter table restaurants add column if not exists contato_whatsapp text;

-- Backfill do Pranzo com os valores reais que já estavam hardcoded —
-- comportamento dele não muda, só passa a vir do banco em vez do código.
update restaurants
set contato_email = 'viverevivi37@gmail.com', contato_whatsapp = '+553499853227'
where slug = 'pranzo' and contato_email is null;
