# Auditoría v6

## Cambios funcionales
- Se añadió **Modificar** a cada cita pendiente de Agenda.
- La edición permite cambiar cliente, teléfono, fecha, hora y precio.
- Al guardar una cita modificada, la app vuelve al día correspondiente en Agenda.
- Si cambia la fecha/hora, la cita se reubica automáticamente en Agenda y en Teléfonos porque ambas vistas leen el mismo registro actualizado de Supabase.
- La cita sigue contando en `Pendiente: X` mientras conserve estado `pendiente`.
- El botón **Nueva venta** desde Agenda conserva el día seleccionado en el calendario.

## Correcciones preventivas
- Completar y cancelar ahora exigen que la venta siga en estado `pendiente` también en la operación contra Supabase, evitando cambios duplicados por doble toque o estados desactualizados.
- Cancelar ya no puede convertir accidentalmente una venta completada en cancelada.
- AuthGuard valida el usuario con Supabase y limpia la sesión local si el token dejó de ser válido.
- Se registra una entrada neutral de historial cuando se modifica una cita.

## Supabase
- v6 no requiere tablas ni columnas nuevas. Usa las políticas `UPDATE` ya existentes sobre `sales`.
- Mantiene las migraciones anteriores para teléfono, cierre configurable y retiros.

## Verificación
- Se revisaron todas las rutas y servicios modificados.
- Se hizo comprobación de sintaxis TypeScript/TSX con el compilador TypeScript disponible en el entorno.
- El build completo de Next.js no se ejecutó localmente porque las dependencias npm no estaban instaladas en el entorno de trabajo; Vercel realizará el build real al desplegar.
