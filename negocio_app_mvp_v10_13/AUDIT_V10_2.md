# Auditoría v10.2

- La tarjeta de Vista rápida antes llamada “Clientes totales” ahora muestra “Citas pendientes”.
- El contador consulta únicamente `sales.status = pendiente` para el usuario actual.
- Al marcar una cita como `completada`, deja de cumplir ese filtro y el contador disminuye con la recarga/RealtIme ya existente.
- No se modificó el comportamiento global de scroll corregido en v10.1.
- No requiere migración SQL.
