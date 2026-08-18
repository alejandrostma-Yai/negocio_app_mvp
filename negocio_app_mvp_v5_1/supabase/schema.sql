create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null default '',
  deactivated_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  mp1 numeric(12,2) not null default 175,
  mp2 numeric(12,2) not null default 500,
  mp3 numeric(12,2) not null default 2000,
  daily_house_amount numeric(12,2) not null default 3000,
  goal_name text not null default 'Meta principal',
  goal_amount numeric(14,2) not null default 2150538,
  daily_unit_goal integer not null default 12,
  require_no_pending_to_close boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid references auth.users(id) on delete cascade primary key,
  working_capital numeric(14,2) not null default 0 check (working_capital >= 0),
  house_fund numeric(14,2) not null default 0,
  goal_balance numeric(14,2) not null default 0 check (goal_balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_name text not null,
  phone text,
  sale_date date not null,
  sale_time time not null,
  price numeric(14,2) not null check (price > 0),
  status text not null default 'pendiente'
    check (status in ('pendiente','completada','cancelada','eliminada')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz
);

alter table public.sales add column if not exists phone text;

create table if not exists public.capital_movements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  movement_date date not null default current_date,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.house_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.daily_closures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  business_date date not null,
  completed_sales integer not null default 0,
  gross_amount numeric(14,2) not null default 0,
  replacement_capital numeric(14,2) not null default 0,
  house_allocation numeric(14,2) not null default 0,
  goal_allocation numeric(14,2) not null default 0,
  daily_unit_goal integer not null,
  mp1_snapshot numeric(12,2) not null,
  mp2_snapshot numeric(12,2) not null,
  mp3_snapshot numeric(12,2) not null,
  house_amount_snapshot numeric(12,2) not null,
  closed_at timestamptz not null default now(),
  unique(user_id, business_date)
);

create table if not exists public.transaction_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  amount numeric(14,2) not null default 0,
  direction text not null check(direction in ('ingreso','gasto','neutral')),
  description text not null,
  client_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.wallets enable row level security;
alter table public.sales enable row level security;
alter table public.capital_movements enable row level security;
alter table public.house_expenses enable row level security;
alter table public.daily_closures enable row level security;
alter table public.transaction_history enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['profiles','settings','wallets','sales','capital_movements','house_expenses','daily_closures','transaction_history']
  loop
    execute format('drop policy if exists "own_%1$s_select" on public.%1$I', t);
    execute format('create policy "own_%1$s_select" on public.%1$I for select to authenticated using ((select auth.uid()) = %2$s)', t,
      case when t='profiles' then 'id' else 'user_id' end);
    execute format('drop policy if exists "own_%1$s_insert" on public.%1$I', t);
    execute format('create policy "own_%1$s_insert" on public.%1$I for insert to authenticated with check ((select auth.uid()) = %2$s)', t,
      case when t='profiles' then 'id' else 'user_id' end);
    execute format('drop policy if exists "own_%1$s_update" on public.%1$I', t);
    execute format('create policy "own_%1$s_update" on public.%1$I for update to authenticated using ((select auth.uid()) = %2$s) with check ((select auth.uid()) = %2$s)', t,
      case when t='profiles' then 'id' else 'user_id' end);
    execute format('drop policy if exists "own_%1$s_delete" on public.%1$I', t);
    execute format('create policy "own_%1$s_delete" on public.%1$I for delete to authenticated using ((select auth.uid()) = %2$s)', t,
      case when t='profiles' then 'id' else 'user_id' end);
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.settings(user_id) values (new.id);
  insert into public.wallets(user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.register_capital_spend(
  p_amount numeric,
  p_note text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_balance numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  select working_capital into v_balance from public.wallets where user_id = v_user for update;
  if p_amount <= 0 then raise exception 'Monto inválido'; end if;
  if v_balance < p_amount then raise exception 'Capital insuficiente'; end if;

  update public.wallets
  set working_capital = working_capital - p_amount, updated_at = now()
  where user_id = v_user;

  insert into public.capital_movements(user_id, amount, note)
  values(v_user, p_amount, p_note);

  insert into public.transaction_history(user_id, type, amount, direction, description)
  values(v_user, 'inversion', p_amount, 'gasto', coalesce(p_note, 'Inversión de capital'));
end;
$$;

create or replace function public.close_business_day(p_business_date date)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_settings public.settings%rowtype;
  v_pending integer;
  v_count integer;
  v_gross numeric;
  v_replacement numeric;
  v_house numeric;
  v_goal numeric;
  v_replacement_per_sale constant numeric := 2705;
  v_house_daily constant numeric := 3000;
begin
  if v_user is null then raise exception 'No autenticado'; end if;

  if exists (
    select 1 from public.daily_closures
    where user_id = v_user and business_date = p_business_date
  ) then
    raise exception 'Este día ya fue cerrado';
  end if;

  select * into v_settings
  from public.settings
  where user_id = v_user;

  select count(*) into v_pending
  from public.sales
  where user_id = v_user
    and sale_date = p_business_date
    and status = 'pendiente';

  if v_settings.require_no_pending_to_close and v_pending > 0 then
    raise exception 'Hay ventas pendientes para este día';
  end if;

  select count(*), coalesce(sum(price), 0)
    into v_count, v_gross
  from public.sales
  where user_id = v_user
    and status = 'completada'
    and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date = p_business_date;

  if v_count = 0 then
    raise exception 'No hay ventas completadas para cerrar este día';
  end if;

  v_replacement := v_count * v_replacement_per_sale;

  if v_gross < v_replacement then
    raise exception 'El monto bruto no cubre RD$2,705 por cada venta completada';
  end if;

  v_house := least(v_house_daily, greatest(v_gross - v_replacement, 0));
  v_goal := greatest(v_gross - v_replacement - v_house, 0);

  insert into public.daily_closures(
    user_id, business_date, completed_sales, gross_amount, replacement_capital,
    house_allocation, goal_allocation, daily_unit_goal,
    mp1_snapshot, mp2_snapshot, mp3_snapshot, house_amount_snapshot
  ) values (
    v_user, p_business_date, v_count, v_gross, v_replacement,
    v_house, v_goal, v_settings.daily_unit_goal,
    v_settings.mp1, v_settings.mp2, v_settings.mp3, v_house_daily
  );

  update public.wallets
  set working_capital = working_capital + v_replacement,
      house_fund = house_fund + v_house,
      goal_balance = goal_balance + v_goal,
      updated_at = now()
  where user_id = v_user;

  insert into public.transaction_history(user_id, type, amount, direction, description)
  values
    (v_user, 'cierre_capital', v_replacement, 'ingreso',
      'Cierre diario: RD$2,705 × ' || v_count || ' venta(s) completada(s)'),
    (v_user, 'cierre_casa', v_house, 'ingreso',
      'Cierre diario: aporte único a Casa'),
    (v_user, 'cierre_meta', v_goal, 'ingreso',
      'Cierre diario: resto destinado a la meta');

  return jsonb_build_object(
    'fecha', p_business_date,
    'ventas_completadas', v_count,
    'bruto', v_gross,
    'capital_por_venta', v_replacement_per_sale,
    'capital', v_replacement,
    'casa', v_house,
    'meta', v_goal
  );
end;
$$;

