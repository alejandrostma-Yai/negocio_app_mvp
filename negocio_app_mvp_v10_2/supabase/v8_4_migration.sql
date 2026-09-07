alter table public.settings
add column if not exists home_note text;

create or replace function public.reset_business_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;

  -- Datos operativos: se borran solo los del usuario autenticado.
  delete from public.transaction_history where user_id = v_user;
  delete from public.daily_closures where user_id = v_user;
  delete from public.house_expenses where user_id = v_user;
  delete from public.capital_movements where user_id = v_user;
  delete from public.second_order_phones where user_id = v_user;

  if to_regclass('public.link_bloc_notes') is not null then
    execute 'delete from public.link_bloc_notes where user_id = $1' using v_user;
  end if;

  delete from public.sales where user_id = v_user;

  update public.wallets
  set working_capital = 0,
      house_fund = 0,
      goal_balance = 0,
      updated_at = now()
  where user_id = v_user;

  -- La fila de settings NO se modifica: conserva materias primas,
  -- Casa configurada, monto/meta, meta diaria, nota y preferencias de cierre.
end;
$$;
