do $$ declare definition text; begin
 select pg_get_functiondef('public.platform_admin_business_details(uuid,timestamp with time zone,timestamp with time zone)'::regprocedure) into definition;
 if position('s.social_links ->> ''instagram''::text' in definition)>0 then
   definition := replace(definition, '''instagram'', (s.social_links ->> ''instagram''::text)', '''social'', COALESCE(NULLIF(btrim(s.social_links ->> ''social''::text), ''''), NULLIF(btrim(s.social_links ->> ''instagram''::text), ''''))');
 elsif position('s.social_links->>''instagram''' in definition)>0 then
   definition := replace(definition, '''instagram'',s.social_links->>''instagram''', '''social'',coalesce(nullif(trim(s.social_links->>''social''),''''),nullif(trim(s.social_links->>''instagram''),''''))');
 else
   raise exception 'Campo de rede social não encontrado';
 end if;
 if position('''social'', ' in definition)=0 and position('''social'',coalesce' in definition)=0 then raise exception 'Atualização não aplicada'; end if;
 execute definition;
end $$;
