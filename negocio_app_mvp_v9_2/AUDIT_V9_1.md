# AUDIT V9.1

## Cambios
- Sincronización en tiempo real entre dispositivos mediante Supabase Realtime.
- Los cambios de ventas/clientes, carteras, historial, cierres, teléfonos y notas compartidas actualizan la pantalla abierta sin recargar manualmente.
- Contador regresivo en Inicio para el tipo de cierre configurado.
- Cierre diario: cuenta hasta las 12:00 a. m. (hora de República Dominicana).
- Cierre semanal: cuenta hasta terminar el domingo.
- El temporizador es informativo: el cierre sigue siendo manual para evitar cierres accidentales.

## Base
- Construida sobre v9.0; conserva el aporte manual a Capital sin afectar monto bruto ni distribución.

## Supabase
- Ejecutar `supabase/v9_1_migration.sql` para incluir las tablas operativas en la publicación `supabase_realtime`.
