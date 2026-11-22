alter table public.product_ingredients drop constraint product_ingredients_unit_check;
alter table public.product_ingredients add constraint product_ingredients_unit_check check (length(trim(unit)) between 1 and 40 and unit = lower(trim(unit)));
do $$ declare definition text; begin
 select pg_get_functiondef('public.save_product_ingredients(uuid,jsonb)'::regprocedure) into definition;
 if position('item->>''unit''' in definition) = 0 then raise exception 'Validação da unidade não encontrada'; end if;
 definition := replace(definition, 'item->>''unit''', 'lower(trim(item->>''unit''))');
 execute definition;
end $$;
