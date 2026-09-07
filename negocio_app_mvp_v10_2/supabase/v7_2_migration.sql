-- v7.2: correo de cliente para citas y botón Copiar.
alter table public.sales add column if not exists email text;

-- v7.2: defaults en cero SOLO para usuarios nuevos.
-- ALTER COLUMN SET DEFAULT no cambia las filas existentes.
alter table public.settings alter column mp1 set default 0;
alter table public.settings alter column mp2 set default 0;
alter table public.settings alter column mp3 set default 0;
alter table public.settings alter column daily_house_amount set default 0;
alter table public.settings alter column goal_amount set default 0;
