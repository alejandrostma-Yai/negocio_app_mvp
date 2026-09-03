-- v7.3: pestaña Link con notas por cita pendiente.
-- No borra datos existentes.
alter table public.sales add column if not exists link_note text;

-- Mantener los valores iniciales en cero SOLO para usuarios nuevos.
-- Cambiar defaults no modifica usuarios existentes.
alter table public.settings alter column mp1 set default 0;
alter table public.settings alter column mp2 set default 0;
alter table public.settings alter column mp3 set default 0;
alter table public.settings alter column daily_house_amount set default 0;
alter table public.settings alter column goal_amount set default 0;
