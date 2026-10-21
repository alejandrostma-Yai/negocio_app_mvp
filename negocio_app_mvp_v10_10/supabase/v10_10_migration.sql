-- Financia Flow v10.10: nota breve para seguimiento de llamadas
alter table public.sales add column if not exists contact_note varchar(19);
