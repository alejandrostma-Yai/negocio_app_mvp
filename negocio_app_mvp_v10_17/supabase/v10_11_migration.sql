-- Financia Flow v10.11: asegura la columna de notas breves para llamadas.
-- Ejecutar en Supabase SQL Editor si aparece "column sales.contact_note does not exist".
alter table public.sales add column if not exists contact_note varchar(19);
