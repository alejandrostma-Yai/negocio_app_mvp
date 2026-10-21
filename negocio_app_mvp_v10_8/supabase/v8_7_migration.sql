-- v8.7 — herramientas individuales del Bloc
alter table public.link_bloc_notes
add column if not exists counter_value integer not null default 0;

alter table public.link_bloc_notes
add column if not exists timer_seconds integer not null default 0;

alter table public.link_bloc_notes
drop constraint if exists link_bloc_notes_counter_nonnegative;
alter table public.link_bloc_notes
add constraint link_bloc_notes_counter_nonnegative check (counter_value >= 0);

alter table public.link_bloc_notes
drop constraint if exists link_bloc_notes_timer_nonnegative;
alter table public.link_bloc_notes
add constraint link_bloc_notes_timer_nonnegative check (timer_seconds >= 0);
