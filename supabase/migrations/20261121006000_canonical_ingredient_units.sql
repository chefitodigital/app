create function public.canonical_ingredient_unit(value text) returns text language sql immutable set search_path='' as $$
 select case lower(trim(value))
 when 'g' then 'g' when 'gr' then 'g' when 'grama' then 'g' when 'gramas' then 'g'
 when 'kg' then 'kg' when 'quilo' then 'kg' when 'quilos' then 'kg' when 'quilograma' then 'kg' when 'quilogramas' then 'kg'
 when 'ml' then 'ml' when 'mililitro' then 'ml' when 'mililitros' then 'ml'
 when 'l' then 'l' when 'litro' then 'l' when 'litros' then 'l'
 when 'un' then 'unidade' when 'unidade' then 'unidade' when 'unidades' then 'unidade'
 when 'folhas' then 'folha' when 'rodelas' then 'rodela' when 'fatias' then 'fatia' when 'colheres' then 'colher' when 'porções' then 'porção'
 else lower(trim(value)) end;
$$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.ingredient_consumption(uuid,timestamptz,timestamptz)'::regprocedure) into definition;
 if position('u.unit' in definition)=0 then raise exception 'Unidade não encontrada'; end if;
 execute replace(definition,'u.unit','public.canonical_ingredient_unit(u.unit)');
end $$;
