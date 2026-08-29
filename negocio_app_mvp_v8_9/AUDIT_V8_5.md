# AUDIT V8.5

## Cambio principal
Se separó el momento en que una orden queda instalada del momento en que realmente se cobra.

## Flujo
- `pendiente`: cita/trabajo todavía pendiente.
- `pendiente_pago`: instalación terminada, todavía no cobrada.
- `completada`: cobrada. Solo aquí se asigna `completed_at`.
- `cancelada`: orden cancelada.

## Impacto financiero
- El Monto bruto de hoy sigue consultando `status = completada` y `completed_at` dentro del día actual.
- Por lo tanto, una orden instalada pendiente de pago no suma al bruto.
- Al tocar `Cobrado`, el dinero entra al bruto del día real de cobro y queda disponible para el cierre diario.

## Agenda
- El botón principal de una cita pendiente ahora dice `Instalado`.
- Al marcarla, pasa a una sección global `Pendientes de cobro`.
- Desde esa sección se confirma `Cobrado`.

## Segunda orden
La lista de teléfonos pendientes a segunda orden avanza al terminar la instalación, no al cobrar.
