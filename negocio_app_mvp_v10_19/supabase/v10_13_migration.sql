-- Financia Flow v10.13
-- Personaliza los dos fondos y distribuye el neto luego de descontar materias primas.
-- Configuración inicial: Capital del negocio 50%, Casa 50%.

alter table public.settings add column if not exists fund1_name text not null default 'Capital del negocio';
alter table public.settings add column if not exists fund2_name text not null default 'Casa';
alter table public.settings add column if not exists fund1_percentage numeric(5,2) not null default 50;
alter table public.settings add column if not exists fund2_percentage numeric(5,2) not null default 50;

update public.settings set
  fund1_name = coalesce(nullif(trim(fund1_name), ''), 'Capital del negocio'),
  fund2_name = coalesce(nullif(trim(fund2_name), ''), 'Casa'),
  fund1_percentage = coalesce(fund1_percentage, 50),
  fund2_percentage = coalesce(fund2_percentage, 50);

alter table public.settings drop constraint if exists settings_fund_percentages_check;
alter table public.settings add constraint settings_fund_percentages_check
  check (fund1_percentage >= 0 and fund1_percentage <= 100 and fund2_percentage >= 0 and fund2_percentage <= 100 and fund1_percentage + fund2_percentage = 100);

create or replace function public.close_business_day(p_business_date date)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_settings public.settings%rowtype; v_pending integer; v_count integer; v_gross numeric;
  v_per numeric; v_materials numeric; v_remaining numeric; v_fund1 numeric; v_fund2 numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if exists(select 1 from public.daily_closures where user_id=v_user and business_date=p_business_date) then raise exception 'Este día ya fue cerrado'; end if;
  if exists(select 1 from public.weekly_closures where user_id=v_user and p_business_date between week_start and week_end) then raise exception 'Este día pertenece a una semana que ya fue cerrada'; end if;
  select * into v_settings from public.settings where user_id=v_user;
  if not found then raise exception 'No se encontró la configuración'; end if;
  if v_settings.fund1_percentage + v_settings.fund2_percentage <> 100 then raise exception 'Los porcentajes de los dos fondos deben sumar 100%'; end if;

  select count(*) into v_pending from public.sales where user_id=v_user and sale_date=p_business_date and status='pendiente' and company_id=2;
  if v_settings.require_no_pending_to_close and v_pending>0 then raise exception 'Hay ventas pendientes de Empresa 2 para este día'; end if;

  select count(*),coalesce(sum(price),0) into v_count,v_gross
  from public.sales where user_id=v_user and status='completada' and company_id=2 and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date=p_business_date;
  if v_count=0 then raise exception 'No hay ventas cobradas/completadas de Empresa 2 para cerrar este día'; end if;

  v_per:=coalesce(v_settings.mp1,0)+coalesce(v_settings.mp2,0)+coalesce(v_settings.mp3,0);
  v_materials:=v_count*v_per;
  if v_gross<v_materials then raise exception 'El monto bruto de Empresa 2 no cubre el costo configurado de materias primas'; end if;
  v_remaining:=v_gross-v_materials;
  v_fund1:=round(v_remaining*coalesce(v_settings.fund1_percentage,50)/100,2);
  v_fund2:=v_remaining-v_fund1;

  insert into public.daily_closures(user_id,business_date,completed_sales,gross_amount,replacement_capital,house_allocation,goal_allocation,daily_unit_goal,mp1_snapshot,mp2_snapshot,mp3_snapshot,house_amount_snapshot)
  values(v_user,p_business_date,v_count,v_gross,v_fund1,v_fund2,0,v_settings.daily_unit_goal,v_settings.mp1,v_settings.mp2,v_settings.mp3,v_settings.daily_house_amount);
  update public.wallets set working_capital=working_capital+v_fund1,house_fund=house_fund+v_fund2,goal_balance=goal_balance,updated_at=now() where user_id=v_user;
  insert into public.transaction_history(user_id,type,amount,direction,description,company_id) values
   (v_user,'cierre_capital',v_fund1,'ingreso','Cierre diario: '||v_settings.fund1_name||' ('||v_settings.fund1_percentage||'%) · Empresa 2',2),
   (v_user,'cierre_casa',v_fund2,'ingreso','Cierre diario: '||v_settings.fund2_name||' ('||v_settings.fund2_percentage||'%) · Empresa 2',2);
  return jsonb_build_object('fecha',p_business_date,'ventas_cobradas',v_count,'bruto',v_gross,'materias_primas',v_materials,'fondo_1_nombre',v_settings.fund1_name,'fondo_1',v_fund1,'fondo_2_nombre',v_settings.fund2_name,'fondo_2',v_fund2,'meta',0);
end;$$;

create or replace function public.close_business_week(p_week_start date)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_settings public.settings%rowtype; v_end date:=p_week_start+6; v_count integer; v_days integer; v_gross numeric;
  v_per numeric; v_materials numeric; v_remaining numeric; v_fund1 numeric; v_fund2 numeric;
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if extract(isodow from p_week_start)<>1 then raise exception 'La semana debe comenzar un lunes'; end if;
  if exists(select 1 from public.weekly_closures where user_id=v_user and week_start=p_week_start) then raise exception 'Esta semana ya fue cerrada'; end if;
  if exists(select 1 from public.daily_closures where user_id=v_user and business_date between p_week_start and v_end) then raise exception 'Hay días de esta semana que ya fueron cerrados individualmente'; end if;
  select * into v_settings from public.settings where user_id=v_user;
  if not found then raise exception 'No se encontró la configuración'; end if;
  if v_settings.fund1_percentage + v_settings.fund2_percentage <> 100 then raise exception 'Los porcentajes de los dos fondos deben sumar 100%'; end if;
  select count(*),coalesce(sum(price),0),count(distinct (completed_at at time zone 'America/Santo_Domingo')::date) into v_count,v_gross,v_days
  from public.sales where user_id=v_user and status='completada' and company_id=2 and completed_at is not null
    and (completed_at at time zone 'America/Santo_Domingo')::date between p_week_start and v_end;
  if v_count=0 then raise exception 'No hay ventas cobradas/completadas de Empresa 2 para cerrar esta semana'; end if;
  v_per:=coalesce(v_settings.mp1,0)+coalesce(v_settings.mp2,0)+coalesce(v_settings.mp3,0);
  v_materials:=v_count*v_per;
  if v_gross<v_materials then raise exception 'El monto bruto de Empresa 2 no cubre el costo configurado de materias primas'; end if;
  v_remaining:=v_gross-v_materials;
  v_fund1:=round(v_remaining*coalesce(v_settings.fund1_percentage,50)/100,2);
  v_fund2:=v_remaining-v_fund1;
  insert into public.weekly_closures(user_id,week_start,week_end,completed_sales,worked_days,gross_amount,replacement_capital,house_allocation,goal_allocation,mp1_snapshot,mp2_snapshot,mp3_snapshot,house_amount_snapshot)
  values(v_user,p_week_start,v_end,v_count,v_days,v_gross,v_fund1,v_fund2,0,v_settings.mp1,v_settings.mp2,v_settings.mp3,v_settings.daily_house_amount);
  update public.wallets set working_capital=working_capital+v_fund1,house_fund=house_fund+v_fund2,goal_balance=goal_balance,updated_at=now() where user_id=v_user;
  insert into public.transaction_history(user_id,type,amount,direction,description,company_id) values
   (v_user,'cierre_semanal_capital',v_fund1,'ingreso','Cierre semanal: '||v_settings.fund1_name||' ('||v_settings.fund1_percentage||'%) · Empresa 2',2),
   (v_user,'cierre_semanal_casa',v_fund2,'ingreso','Cierre semanal: '||v_settings.fund2_name||' ('||v_settings.fund2_percentage||'%) · Empresa 2',2);
  return jsonb_build_object('semana_inicio',p_week_start,'semana_fin',v_end,'ventas_cobradas',v_count,'dias_trabajados',v_days,'bruto',v_gross,'materias_primas',v_materials,'fondo_1_nombre',v_settings.fund1_name,'fondo_1',v_fund1,'fondo_2_nombre',v_settings.fund2_name,'fondo_2',v_fund2,'meta',0);
end;$$;
