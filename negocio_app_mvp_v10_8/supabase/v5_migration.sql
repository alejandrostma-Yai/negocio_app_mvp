-- V5: teléfono opcional para las citas/ventas.
-- Ejecuta este bloque UNA SOLA VEZ en Supabase > SQL Editor antes de usar la V5.

alter table public.sales
add column if not exists phone text;
