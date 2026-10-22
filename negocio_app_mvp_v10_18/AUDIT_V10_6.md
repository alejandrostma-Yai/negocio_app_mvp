# Financia Flow v10.6

## Vista rápida rediseñada
- La vista rápida consulta y muestra exclusivamente citas de Empresa 2 (`company_id = 2`).
- Se retiraron de Vista rápida las tarjetas de Casa, Capital de trabajo y Meta financiera, así como las notas y ventas del mes.
- Se muestran indicadores para monto bruto cobrado hoy, órdenes pendientes, pendientes de llamada y citas totales de hoy.
- La lista principal muestra todas las citas del día de Empresa 2, ordenadas por hora, con estado, monto y acción de llamada cuando hay teléfono.
- La meta de clientes diarios aparece como una barra de progreso destacada basada en las citas agendadas para el día frente a `daily_unit_goal`.
- Se conserva el contador del cierre diario/semanal y el temporizador/consejos de Enfoque de trabajo.
- No se requiere migración SQL nueva; utiliza los campos de Empresa 2 añadidos en v10.3.

## Verificación
- Se realizaron comprobaciones estáticas de los cambios. No se pudo completar una compilación local en este entorno porque la instalación de dependencias agotó el tiempo disponible; Vercel debe confirmar el build final.
