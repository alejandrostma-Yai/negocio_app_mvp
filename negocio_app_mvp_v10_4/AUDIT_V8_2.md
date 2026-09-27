# AUDIT V8.2

Cambios incluidos:
- Teléfonos mantiene la lista de citas pendientes y añade al final “Pendiente a segunda orden”.
- Primera orden completada con teléfono: el número pasa a la lista de segunda orden, sin nombre de cliente.
- Si ese número ya está esperando segunda orden, una nueva orden completada o cancelada lo elimina de la lista.
- Comparación por dígitos normalizados para tolerar formatos distintos del mismo número.
- Link añade un botón pequeño “Bloc” al pie.
- Bloc general separado y persistente por usuario en settings.link_general_note.
- Migración incluida en supabase/v8_2_migration.sql.
