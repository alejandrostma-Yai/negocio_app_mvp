-- V5.1: cierre diario con las reglas acordadas.
-- Capital de trabajo: RD$2,705 por cada venta completada del día.
-- Casa: RD$3,000 una sola vez por día.
-- El resto del monto bruto pasa a la meta financiera.
-- Un día no puede cerrarse dos veces.

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
