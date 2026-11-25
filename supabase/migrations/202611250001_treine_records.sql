create table if not exists public.treine_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('routine', 'workout', 'plan')),
  id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  primary key (user_id, kind, id)
);

alter table public.treine_records enable row level security;
revoke all on table public.treine_records from anon, authenticated;
grant select, insert, update on table public.treine_records to authenticated;

create policy "Read own TreineAI records" on public.treine_records
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Create own TreineAI records" on public.treine_records
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Update own TreineAI records" on public.treine_records
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
