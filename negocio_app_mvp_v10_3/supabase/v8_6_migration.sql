-- v8.6 — cierre diario/semanal y solo cobros completados
alter table public.settings add column if not exists close_mode text not null default 'daily';
alter table public.settings drop constraint if exists settings_close_mode_check;
alter table public.settings add constraint settings_close_mode_check check (close_mode in ('daily','weekly'));

create table if not exists public.weekly_closures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  completed_sales integer not null default 0,
  worked_days integer not null default 0,
  gross_amount numeric(14,2) not null default 0,
  replacement_capital numeric(14,2) not null default 0,
  house_allocation numeric(14,2) not null default 0,
  goal_allocation numeric(14,2) not null default 0,
  mp1_snapshot numeric(12,2) not null,
  mp2_snapshot numeric(12,2) not null,
  mp3_snapshot numeric(12,2) not null,
  house_amount_snapshot numeric(12,2) not null,
  closed_at timestamptz not null default now(),
  unique(user_id, week_start)
);
alter table public.weekly_closures enable row level security;
drop policy if exists "own_weekly_closures_select" on public.weekly_closures;
create policy "own_weekly_closures_select" on public.weekly_closures for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "own_weekly_closures_insert" on public.weekly_closures;
create policy "own_weekly_closures_insert" on public.weekly_closures for insert to authenticated with check ((select auth.uid())=user_id);

create or replace function public.close_business_week(p_week_start date)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_settings public.settings%rowtype;
  v_end date:=p_week_start+6; v_count integer; v_days integer; v_gross numeric;
  v_per numeric; v_cap numeric; v_house numeric; v_goal numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if extract(isodow from p_week_start)<>1 then raise exception 'La semana debe comenzar un lunes'; end if;
  if exists(select 1 from public.weekly_closures where user_id=v_user and week_start=p_week_start) then raise exception 'Esta semana ya fue cerrada'; end if;
  if exists(select 1 from public.daily_closures where user_id=v_user and business_date between p_week_start and v_end) then raise exception 'Hay días de esta semana que ya fueron cerrados individualmente'; end if;
  select * into v_settings from public.settings where user_id=v_user;
  if not found then raise exception 'No se encontró la configuración'; end if;
  select count(*),coalesce(sum(price),0),count(distinct (completed_at at time zone 'America/Santo_Domingo')::date)
    into v_count,v_gross,v_days
  from public.sales where user_id=v_user and status='completada' and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date between p_week_start and v_end;
  if v_count=0 then raise exception 'No hay ventas cobradas/completadas para cerrar esta semana'; end if;
  v_per:=coalesce(v_settings.mp1,0)+coalesce(v_settings.mp2,0)+coalesce(v_settings.mp3,0);
  v_cap:=v_count*v_per;
  if v_gross<v_cap then raise exception 'El monto bruto no cubre el costo configurado de materias primas'; end if;
  v_house:=least(coalesce(v_settings.daily_house_amount,0)*v_days,greatest(v_gross-v_cap,0));
  v_goal:=greatest(v_gross-v_cap-v_house,0);
  insert into public.weekly_closures(user_id,week_start,week_end,completed_sales,worked_days,gross_amount,replacement_capital,house_allocation,goal_allocation,mp1_snapshot,mp2_snapshot,mp3_snapshot,house_amount_snapshot)
  values(v_user,p_week_start,v_end,v_count,v_days,v_gross,v_cap,v_house,v_goal,v_settings.mp1,v_settings.mp2,v_settings.mp3,v_settings.daily_house_amount);
  update public.wallets set working_capital=working_capital+v_cap,house_fund=house_fund+v_house,goal_balance=goal_balance+v_goal,updated_at=now() where user_id=v_user;
  insert into public.transaction_history(user_id,type,amount,direction,description) values
    (v_user,'cierre_semanal_capital',v_cap,'ingreso','Cierre semanal: capital de trabajo'),
    (v_user,'cierre_semanal_casa',v_house,'ingreso','Cierre semanal: Casa'),
    (v_user,'cierre_semanal_meta',v_goal,'ingreso','Cierre semanal: Meta');
  return jsonb_build_object('semana_inicio',p_week_start,'semana_fin',v_end,'ventas_cobradas',v_count,'dias_trabajados',v_days,'bruto',v_gross,'capital',v_cap,'casa',v_house,'meta',v_goal);
end;$$;

-- Evita doble distribución si una semana ya fue cerrada.
create or replace function public.close_business_day(p_business_date date)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_settings public.settings%rowtype; v_pending integer; v_count integer; v_gross numeric;
  v_per numeric; v_cap numeric; v_house numeric; v_goal numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if exists(select 1 from public.daily_closures where user_id=v_user and business_date=p_business_date) then raise exception 'Este día ya fue cerrado'; end if;
  if exists(select 1 from public.weekly_closures where user_id=v_user and p_business_date between week_start and week_end) then raise exception 'Este día pertenece a una semana que ya fue cerrada'; end if;
  select * into v_settings from public.settings where user_id=v_user;
  if not found then raise exception 'No se encontró la configuración'; end if;
  select count(*) into v_pending from public.sales where user_id=v_user and sale_date=p_business_date and status='pendiente';
  if v_settings.require_no_pending_to_close and v_pending>0 then raise exception 'Hay ventas pendientes para este día'; end if;
  select count(*),coalesce(sum(price),0) into v_count,v_gross from public.sales where user_id=v_user and status='completada' and completed_at is not null and (completed_at at time zone 'America/Santo_Domingo')::date=p_business_date;
  if v_count=0 then raise exception 'No hay ventas cobradas/completadas para cerrar este día'; end if;
  v_per:=coalesce(v_settings.mp1,0)+coalesce(v_settings.mp2,0)+coalesce(v_settings.mp3,0); v_cap:=v_count*v_per;
  if v_gross<v_cap then raise exception 'El monto bruto no cubre el costo configurado de materias primas'; end if;
  v_house:=least(coalesce(v_settings.daily_house_amount,0),greatest(v_gross-v_cap,0)); v_goal:=greatest(v_gross-v_cap-v_house,0);
  insert into public.daily_closures(user_id,business_date,completed_sales,gross_amount,replacement_capital,house_allocation,goal_allocation,daily_unit_goal,mp1_snapshot,mp2_snapshot,mp3_snapshot,house_amount_snapshot)
  values(v_user,p_business_date,v_count,v_gross,v_cap,v_house,v_goal,v_settings.daily_unit_goal,v_settings.mp1,v_settings.mp2,v_settings.mp3,v_settings.daily_house_amount);
  update public.wallets set working_capital=working_capital+v_cap,house_fund=house_fund+v_house,goal_balance=goal_balance+v_goal,updated_at=now() where user_id=v_user;
  insert into public.transaction_history(user_id,type,amount,direction,description) values
   (v_user,'cierre_capital',v_cap,'ingreso','Cierre diario: capital'),(v_user,'cierre_casa',v_house,'ingreso','Cierre diario: Casa'),(v_user,'cierre_meta',v_goal,'ingreso','Cierre diario: Meta');
  return jsonb_build_object('fecha',p_business_date,'ventas_cobradas',v_count,'bruto',v_gross,'capital',v_cap,'casa',v_house,'meta',v_goal);
end;$$;

-- Actualiza reset para incluir cierres semanales si la función ya existe.
create or replace function public.reset_business_data()
returns void language plpgsql security invoker set search_path=public as $$
declare v_user uuid:=auth.uid();
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  delete from public.transaction_history where user_id=v_user;
  delete from public.daily_closures where user_id=v_user;
  delete from public.weekly_closures where user_id=v_user;
  delete from public.house_expenses where user_id=v_user;
  delete from public.capital_movements where user_id=v_user;
  delete from public.second_order_phones where user_id=v_user;
  delete from public.link_bloc_notes where user_id=v_user;
  delete from public.sales where user_id=v_user;
  update public.wallets set working_capital=0,house_fund=0,goal_balance=0,updated_at=now() where user_id=v_user;
end;$$;
