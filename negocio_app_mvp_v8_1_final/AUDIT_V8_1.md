# AUDIT V8.1

- Teléfonos: LLAMÓ / CAMINO / LLEGÓ con estado persistente y Limpiar minimalista.
- Link: botón AGG individual tipo toggle; tocar de nuevo lo desactiva.
- Ambos estados se guardan en `public.sales`.
- Al completar o cancelar una cita se limpian `link_note`, `link_agg` y `contact_status`.
- Requiere ejecutar `supabase/v8_1_migration.sql`.
