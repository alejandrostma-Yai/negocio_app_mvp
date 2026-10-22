# Financia Flow v10.15

- Añade registro de gastos para Empresa 2 con concepto, importe y fecha.
- El historial de movimientos registra cada gasto como salida.
- Vista principal distingue ventas brutas totales, gastos registrados y monto bruto disponible.
- El cierre diario/semanal resta gastos de Empresa 2 además de materias primas antes de distribuir el neto entre los fondos configurados.
- Requiere ejecutar `supabase/v10_15_migration.sql` en Supabase antes del despliegue.
