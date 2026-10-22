-- v8.5 — separar instalación de cobro
-- Una orden instalada queda pendiente de pago y no suma al monto bruto.
-- Solo al marcarla como Cobrado pasa a completada y completed_at registra la fecha real del cobro.

alter table public.sales
add column if not exists installed_at timestamptz;

alter table public.sales
drop constraint if exists sales_status_check;

alter table public.sales
add constraint sales_status_check
check (status in ('pendiente','pendiente_pago','completada','cancelada','eliminada'));

-- La lógica de "pendiente a segunda orden" debe avanzar al terminar la instalación,
-- no al momento del cobro. Una cancelación también retira un número que ya estaba
-- esperando su segunda orden.
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
  if old.status <> 'pendiente'
     or new.status not in ('pendiente_pago', 'cancelada') then
    return new;
  end if;

  if new.phone is null or btrim(new.phone) = '' then
    return new;
  end if;

  v_digits := regexp_replace(new.phone, '[^0-9]', '', 'g');
  if v_digits = '' then
    return new;
  end if;

  select exists(
    select 1
    from public.second_order_phones
    where user_id = new.user_id
      and phone_digits = v_digits
  ) into v_exists;

  if v_exists then
    -- Era un número esperando segunda orden: al instalar o cancelar esa orden, se retira.
    delete from public.second_order_phones
    where user_id = new.user_id
      and phone_digits = v_digits;
  elsif new.status = 'pendiente_pago' then
    -- Primera instalación terminada: el número queda disponible para una segunda orden.
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
