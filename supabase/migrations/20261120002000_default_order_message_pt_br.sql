alter table public.restaurant_settings
  alter column order_confirmation_message set default 'Pedido recebido! Em breve, confirmaremos os detalhes.';

update public.restaurant_settings
set order_confirmation_message = 'Pedido recebido! Em breve, confirmaremos os detalhes.'
where replace(order_confirmation_message, E'\r\n', E'\n') = E'Obrigado pelo seu pedido!\n\nRecebemos o seu pedido e estamos a prepará-lo com todo o cuidado.\n\nEntraremos em contacto consigo brevemente para confirmar os detalhes.\n\nCaso tenha alguma dúvida, não hesite em contactar-nos.';
