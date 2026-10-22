-- v8.2 — bloc general de Link + teléfonos pendientes a segunda orden

alter table public.settings
add column if not exists link_general_note text;

create table if not exists public.second_order_phones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  phone text not null,
  phone_digits text not null,
  created_at timestamptz not null default now(),
  unique(user_id, phone_digits)
);

alter table public.second_order_phones enable row level security;

drop policy if exists "own_second_order_phones_select" on public.second_order_phones;
create policy "own_second_order_phones_select" on public.second_order_phones
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "own_second_order_phones_insert" on public.second_order_phones;
create policy "own_second_order_phones_insert" on public.second_order_phones
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "own_second_order_phones_update" on public.second_order_phones;
create policy "own_second_order_phones_update" on public.second_order_phones
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own_second_order_phones_delete" on public.second_order_phones;
create policy "own_second_order_phones_delete" on public.second_order_phones
for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.sync_second_order_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text;
  v_exists boolean;
begin
  if old.status <> 'pendiente' or new.status not in ('completada', 'cancelada') then
    return new;
  end if;

  if new.phone is null or btrim(new.phone) = '' then
    return new;
  end if;

  v_digits := regexp_replace(new.phone, '[^0-9]', '', 'g');
  if v_digits = '' then return new; end if;

  select exists(
    select 1 from public.second_order_phones
    where user_id = new.user_id and phone_digits = v_digits
  ) into v_exists;

  if v_exists then
    -- Ya estaba esperando la segunda orden: al completar O cancelar esta orden, se retira.
    delete from public.second_order_phones
    where user_id = new.user_id and phone_digits = v_digits;
  elsif new.status = 'completada' then
    -- Primera orden completada: el número queda disponible para una segunda orden.
    insert into public.second_order_phones(user_id, phone, phone_digits)
    values (new.user_id, new.phone, v_digits)
    on conflict (user_id, phone_digits) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_second_order_phone on public.sales;
create trigger trg_sync_second_order_phone
after update of status on public.sales
for each row execute function public.sync_second_order_phone();
