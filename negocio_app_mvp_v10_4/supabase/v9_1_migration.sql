-- OG / Financia Flow v9.1
-- Activa Supabase Realtime para sincronización inmediata entre dispositivos.
-- Seguro para ejecutar más de una vez: solo agrega las tablas que todavía no están publicadas.

do $$
declare
  t text;
begin
  foreach t in array array[
    'sales',
    'wallets',
    'settings',
    'transaction_history',
    'daily_closures',
    'weekly_closures',
    'second_order_phones',
    'link_bloc_notes'
  ]
  loop
    if to_regclass('public.' || t) is not null
       and not exists (
         select 1
         from pg_publication_tables
         where pubname = 'supabase_realtime'
           and schemaname = 'public'
           and tablename = t
       ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
