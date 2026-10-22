-- Financia Flow v10.15
-- Gastos de Empresa 2: se descuentan del bruto disponible y del neto distribuible.
-- El total histórico de ventas brutas se conserva sin alteraciones.

create table if not exists public.business_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(14,2) not null check (amount > 0),
  description text not null check (length(trim(description)) > 0),
  company_id smallint not null default 2 check (company_id in (1,2)),
  created_at timestamptz not null default now()
);

create index if not exists business_expenses_user_created_idx
  on public.business_expenses(user_id, created_at desc);

alter table public.business_expenses enable row level security;
drop policy if exists "own_business_expenses_select" on public.business_expenses;
create policy "own_business_expenses_select" on public.business_expenses
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "own_business_expenses_insert" on public.business_expenses;
create policy "own_business_expenses_insert" on public.business_expenses
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "own_business_expenses_update" on public.business_expenses;
create policy "own_business_expenses_update" on public.business_expenses
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "own_business_expenses_delete" on public.business_expenses;
create policy "own_business_expenses_delete" on public.business_expenses
  for delete to authenticated using ((select auth.uid()) = user_id);

alter table public.daily_closures add column if not exists expenses_amount numeric(14,2) not null default 0;
alter table public.weekly_closures add column if not exists expenses_amount numeric(14,2) not null default 0;

-- Registrar el gasto y su movimiento de historial en una sola transacción.
create or replace function public.register_business_expense(
  p_amount numeric,
  p_description text,
  p_company_id smallint default 2
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'America/Santo_Domingo')::date;
  v_gross numeric := 0;
  v_spent numeric := 0;
  v_id uuid;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'El monto del gasto debe ser mayor que cero'; end if;
  if nullif(trim(p_description), '') is null then raise exception 'Escribe el concepto del gasto'; end if;
  if length(trim(p_description)) > 100 then raise exception 'El concepto no puede superar 100 caracteres'; end if;
  if coalesce(p_company_id, 2) <> 2 then raise exception 'Los gastos desde el monto bruto solo se pueden registrar para Empresa 2'; end if;

  if exists (select 1 from public.daily_closures where user_id = v_user and business_date = v_today)
     or exists (select 1 from public.weekly_closures where user_id = v_user and v_today between week_start and week_end) then
    raise exception 'El periodo ya está cerrado; no se pueden registrar gastos nuevos en este cierre';
  end if;

  select coalesce(sum(price), 0) into v_gross
  from public.sales
  where user_id = v_user and company_id = 2 and status = 'completada'
    and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date = v_today;

  select coalesce(sum(amount), 0) into v_spent
  from public.business_expenses
  where user_id = v_user and company_id = 2
    and (created_at at time zone 'America/Santo_Domingo')::date = v_today;

  if p_amount > greatest(v_gross - v_spent, 0) then
    raise exception 'El gasto supera el monto bruto disponible de hoy';
  end if;

  insert into public.business_expenses(user_id, amount, description, company_id)
  values (v_user, round(p_amount, 2), trim(p_description), 2)
  returning id into v_id;

  insert into public.transaction_history(user_id, type, amount, direction, description, company_id)
  values (v_user, 'gasto_negocio', round(p_amount, 2), 'gasto', 'Gasto del negocio: ' || trim(p_description), 2);

  return jsonb_build_object('id', v_id, 'amount', round(p_amount, 2), 'description', trim(p_description), 'company_id', 2);
end;
$$;

-- Cierre diario: bruto total se conserva en gross_amount, gastos y materias primas
-- se descuentan antes de dividir el remanente entre los fondos configurados.
create or replace function public.close_business_day(p_business_date date)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_settings public.settings%rowtype;
  v_pending integer;
  v_count integer;
  v_gross numeric;
  v_expenses numeric;
  v_per numeric;
  v_materials numeric;
  v_remaining numeric;
  v_fund1 numeric;
  v_fund2 numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if exists (select 1 from public.daily_closures where user_id = v_user and business_date = p_business_date) then raise exception 'Este día ya fue cerrado'; end if;
  if exists (select 1 from public.weekly_closures where user_id = v_user and p_business_date between week_start and week_end) then raise exception 'Este día pertenece a una semana que ya fue cerrada'; end if;

  select * into v_settings from public.settings where user_id = v_user;
  if not found then raise exception 'No se encontró la configuración'; end if;
  if coalesce(v_settings.fund1_percentage, 50) + coalesce(v_settings.fund2_percentage, 50) <> 100 then raise exception 'Los porcentajes de los dos fondos deben sumar 100%'; end if;

  select count(*) into v_pending from public.sales
  where user_id = v_user and sale_date = p_business_date and status = 'pendiente' and company_id = 2;
  if v_settings.require_no_pending_to_close and v_pending > 0 then raise exception 'Hay ventas pendientes de Empresa 2 para este día'; end if;

  select count(*), coalesce(sum(price), 0) into v_count, v_gross
  from public.sales
  where user_id = v_user and status = 'completada' and company_id = 2 and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date = p_business_date;
  if v_count = 0 then raise exception 'No hay ventas cobradas/completadas de Empresa 2 para cerrar este día'; end if;

  select coalesce(sum(amount), 0) into v_expenses
  from public.business_expenses
  where user_id = v_user and company_id = 2
    and (created_at at time zone 'America/Santo_Domingo')::date = p_business_date;

  v_per := coalesce(v_settings.mp1, 0) + coalesce(v_settings.mp2, 0) + coalesce(v_settings.mp3, 0);
  v_materials := v_count * v_per;
  if v_gross < v_materials + v_expenses then raise exception 'El bruto no cubre los gastos registrados y las materias primas'; end if;
  v_remaining := v_gross - v_expenses - v_materials;
  v_fund1 := round(v_remaining * coalesce(v_settings.fund1_percentage, 50) / 100, 2);
  v_fund2 := v_remaining - v_fund1;

  insert into public.daily_closures(
    user_id, business_date, completed_sales, gross_amount, expenses_amount,
    replacement_capital, house_allocation, goal_allocation, daily_unit_goal,
    mp1_snapshot, mp2_snapshot, mp3_snapshot, house_amount_snapshot
  ) values (
    v_user, p_business_date, v_count, v_gross, v_expenses, v_fund1, v_fund2, 0,
    v_settings.daily_unit_goal, v_settings.mp1, v_settings.mp2, v_settings.mp3,
    v_settings.daily_house_amount
  );

  update public.wallets set working_capital = working_capital + v_fund1,
    house_fund = house_fund + v_fund2, updated_at = now() where user_id = v_user;

  insert into public.transaction_history(user_id, type, amount, direction, description, company_id) values
    (v_user, 'cierre_capital', v_fund1, 'ingreso', 'Cierre diario: ' || v_settings.fund1_name || ' (' || v_settings.fund1_percentage || '%) · Empresa 2', 2),
    (v_user, 'cierre_casa', v_fund2, 'ingreso', 'Cierre diario: ' || v_settings.fund2_name || ' (' || v_settings.fund2_percentage || '%) · Empresa 2', 2);

  return jsonb_build_object('fecha', p_business_date, 'ventas_cobradas', v_count, 'bruto_ventas', v_gross,
    'gastos', v_expenses, 'materias_primas', v_materials, 'neto_distribuible', v_remaining,
    'fondo_1_nombre', v_settings.fund1_name, 'fondo_1', v_fund1,
    'fondo_2_nombre', v_settings.fund2_name, 'fondo_2', v_fund2, 'meta', 0);
end;
$$;

-- Cierre semanal: misma regla, sumando los gastos registrados durante la semana.
create or replace function public.close_business_week(p_week_start date)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_settings public.settings%rowtype;
  v_end date := p_week_start + 6;
  v_count integer;
  v_days integer;
  v_gross numeric;
  v_expenses numeric;
  v_per numeric;
  v_materials numeric;
  v_remaining numeric;
  v_fund1 numeric;
  v_fund2 numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if extract(isodow from p_week_start) <> 1 then raise exception 'La semana debe comenzar un lunes'; end if;
  if exists (select 1 from public.weekly_closures where user_id = v_user and week_start = p_week_start) then raise exception 'Esta semana ya fue cerrada'; end if;
  if exists (select 1 from public.daily_closures where user_id = v_user and business_date between p_week_start and v_end) then raise exception 'Hay días de esta semana que ya fueron cerrados individualmente'; end if;

  select * into v_settings from public.settings where user_id = v_user;
  if not found then raise exception 'No se encontró la configuración'; end if;
  if coalesce(v_settings.fund1_percentage, 50) + coalesce(v_settings.fund2_percentage, 50) <> 100 then raise exception 'Los porcentajes de los dos fondos deben sumar 100%'; end if;

  select count(*), coalesce(sum(price), 0), count(distinct (completed_at at time zone 'America/Santo_Domingo')::date)
    into v_count, v_gross, v_days
  from public.sales
  where user_id = v_user and status = 'completada' and company_id = 2 and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date between p_week_start and v_end;
  if v_count = 0 then raise exception 'No hay ventas cobradas/completadas de Empresa 2 para cerrar esta semana'; end if;

  select coalesce(sum(amount), 0) into v_expenses
  from public.business_expenses
  where user_id = v_user and company_id = 2
    and (created_at at time zone 'America/Santo_Domingo')::date between p_week_start and v_end;

  v_per := coalesce(v_settings.mp1, 0) + coalesce(v_settings.mp2, 0) + coalesce(v_settings.mp3, 0);
  v_materials := v_count * v_per;
  if v_gross < v_expenses + v_materials then raise exception 'El bruto no cubre los gastos registrados y las materias primas'; end if;
  v_remaining := v_gross - v_expenses - v_materials;
  v_fund1 := round(v_remaining * coalesce(v_settings.fund1_percentage, 50) / 100, 2);
  v_fund2 := v_remaining - v_fund1;

  insert into public.weekly_closures(
    user_id, week_start, week_end, completed_sales, worked_days, gross_amount, expenses_amount,
    replacement_capital, house_allocation, goal_allocation, mp1_snapshot, mp2_snapshot, mp3_snapshot, house_amount_snapshot
  ) values (
    v_user, p_week_start, v_end, v_count, v_days, v_gross, v_expenses,
    v_fund1, v_fund2, 0, v_settings.mp1, v_settings.mp2, v_settings.mp3, v_settings.daily_house_amount
  );

  update public.wallets set working_capital = working_capital + v_fund1,
    house_fund = house_fund + v_fund2, updated_at = now() where user_id = v_user;

  insert into public.transaction_history(user_id, type, amount, direction, description, company_id) values
    (v_user, 'cierre_semanal_capital', v_fund1, 'ingreso', 'Cierre semanal: ' || v_settings.fund1_name || ' (' || v_settings.fund1_percentage || '%) · Empresa 2', 2),
    (v_user, 'cierre_semanal_casa', v_fund2, 'ingreso', 'Cierre semanal: ' || v_settings.fund2_name || ' (' || v_settings.fund2_percentage || '%) · Empresa 2', 2);

  return jsonb_build_object('semana_inicio', p_week_start, 'semana_fin', v_end, 'ventas_cobradas', v_count,
    'dias_trabajados', v_days, 'bruto_ventas', v_gross, 'gastos', v_expenses, 'materias_primas', v_materials,
    'neto_distribuible', v_remaining, 'fondo_1_nombre', v_settings.fund1_name, 'fondo_1', v_fund1,
    'fondo_2_nombre', v_settings.fund2_name, 'fondo_2', v_fund2, 'meta', 0);
end;
$$;
