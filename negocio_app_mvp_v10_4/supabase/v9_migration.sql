-- Negocio App MVP v9
-- Permite agregar dinero manualmente al Capital de trabajo sin afectar el monto bruto ni el cierre.

create or replace function public.add_working_capital(
  p_amount numeric,
  p_note text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'No autenticado'; end if;
  if p_amount <= 0 then raise exception 'Monto inválido'; end if;

  update public.wallets
  set working_capital = working_capital + p_amount,
      updated_at = now()
  where user_id = v_user;

  if not found then raise exception 'No se encontró la cartera'; end if;

  insert into public.capital_movements(user_id, amount, note)
  values (
    v_user,
    p_amount,
    coalesce(nullif(trim(p_note), ''), 'Aporte manual a capital')
  );

  insert into public.transaction_history(user_id, type, amount, direction, description)
  values (
    v_user,
    'aporte_capital',
    p_amount,
    'ingreso',
    coalesce(nullif(trim(p_note), ''), 'Aporte manual a capital de trabajo')
  );
end;
$$;
