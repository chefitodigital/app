create table if not exists public.platform_ticker (
  id boolean primary key default true check (id),
  message text not null check (char_length(trim(message)) between 1 and 240)
);

alter table public.platform_ticker enable row level security;
revoke all on public.platform_ticker from public, anon, authenticated;
grant select on public.platform_ticker to anon, authenticated;
grant insert, update on public.platform_ticker to authenticated;
create policy "Anyone can read ticker" on public.platform_ticker for select to anon, authenticated using (true);
create policy "Admin can insert ticker" on public.platform_ticker for insert to authenticated with check (auth.uid() = '706060a8-224f-43b9-ac78-ba86da094da5'::uuid);
create policy "Admin can update ticker" on public.platform_ticker for update to authenticated using (auth.uid() = '706060a8-224f-43b9-ac78-ba86da094da5'::uuid) with check (auth.uid() = '706060a8-224f-43b9-ac78-ba86da094da5'::uuid);
insert into public.platform_ticker (id, message) values (true, 'Da cozinha para a tela.') on conflict (id) do nothing;
