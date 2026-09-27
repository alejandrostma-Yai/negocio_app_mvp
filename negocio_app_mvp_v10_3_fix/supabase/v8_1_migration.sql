-- Versión 8.1: estados de seguimiento en Teléfonos + AGG en Link

alter table public.sales
add column if not exists contact_status text;

alter table public.sales
add column if not exists link_agg boolean not null default false;

-- Mantener únicamente los estados válidos de seguimiento.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sales_contact_status_check'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales
    add constraint sales_contact_status_check
    check (contact_status is null or contact_status in ('llamo','camino','llego'));
  end if;
end $$;
