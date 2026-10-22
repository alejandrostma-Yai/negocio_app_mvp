create table if not exists public.link_bloc_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.link_bloc_notes enable row level security;

drop policy if exists "own_link_bloc_notes_select" on public.link_bloc_notes;
create policy "own_link_bloc_notes_select"
on public.link_bloc_notes
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "own_link_bloc_notes_insert" on public.link_bloc_notes;
create policy "own_link_bloc_notes_insert"
on public.link_bloc_notes
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "own_link_bloc_notes_update" on public.link_bloc_notes;
create policy "own_link_bloc_notes_update"
on public.link_bloc_notes
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "own_link_bloc_notes_delete" on public.link_bloc_notes;
create policy "own_link_bloc_notes_delete"
on public.link_bloc_notes
for delete to authenticated
using ((select auth.uid()) = user_id);
