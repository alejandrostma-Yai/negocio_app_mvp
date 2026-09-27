# Financia Flow v10.3 — auditoría de cambios

- Empresa 1 = verde; Empresa 2 = azul.
- `sales.company_id` se añade con default 2 para conservar citas existentes.
- Crear/modificar cita permite seleccionar empresa.
- Agenda, Link, Teléfonos e Historial muestran la empresa.
- Empresa 1 no participa en bruto, Capital, Casa, Meta, cierres diarios/semanales ni potencial de Meta.
- Empresa 2 conserva el flujo financiero actual.
- Los cierres SQL filtran `company_id = 2`.
- Historial guarda `company_id` en nuevos movimientos asociados a citas/cierres.
- No se requiere borrar ni migrar manualmente las citas existentes: quedan como Empresa 2 por defecto.
