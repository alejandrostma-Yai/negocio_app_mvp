# Auditoría V5

Cambios incluidos en esta versión:

- Campo de teléfono al crear una venta/cita, con formato visual `+1 (809) 556-1234`.
- Nueva pestaña **Teléfonos**.
- La lista de teléfonos muestra solo citas pendientes con teléfono.
- La lista se ordena por fecha y hora de la cita.
- El buscador acepta cualquier fragmento numérico (por ejemplo `809`, `556`, `1234`) e ignora símbolos.
- Al completar o cancelar una venta, deja de aparecer automáticamente en Teléfonos porque la lista consulta solo estado `pendiente`.
- **Meta diaria** ahora cuenta las citas nuevas creadas durante el día, no las citas completadas.
- El contador diario se reinicia por fecha local sin borrar las citas anteriores.
- Al pie de Inicio se muestra discretamente `Pendiente: X`, contando todas las ventas pendientes sin importar la fecha.
- Agenda incluye calendario mensual navegable. Al tocar un día se muestran las citas de ese día.
- Los días del calendario con citas muestran un pequeño contador.
- Atajos/Siri NO se integran en V5; quedan para una versión posterior.

## Cambio necesario en Supabase

Ejecutar `supabase/v5_migration.sql` en el SQL Editor antes de desplegar o probar la V5.

El cambio es compatible con las ventas existentes: el teléfono es opcional y las filas antiguas quedan con `phone = null`.
