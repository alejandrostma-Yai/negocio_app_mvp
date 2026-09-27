# Auditoría v7.3

## Cambios
- Nueva pestaña **Link** en la navegación principal.
- Link muestra exclusivamente citas con estado `pendiente`, ordenadas por fecha y hora.
- Cada cita tiene una nota individual guardada en `sales.link_note`.
- Cada nota dispone de **Guardar nota** y **Copiar**.
- Copiar usa Clipboard API cuando está disponible y un fallback compatible para Safari/iOS.
- Al completar o cancelar una cita mediante la app, `link_note` se limpia y la cita desaparece de Link.
- Se conserva toda la funcionalidad de v7.2: correo, vista previa de cierre, icono OG y defaults en cero para usuarios nuevos.

## Supabase
Ejecutar `supabase/v7_3_migration.sql` antes de usar Link. La migración es idempotente y no altera valores de usuarios existentes.
