# Financia Flow v10.10

- El contador de citas totales del sistema excluye las canceladas y las eliminadas.
- Añadido control discreto para ocultar/mostrar el monto bruto de hoy y el del mes, de forma independiente.
- Añadido campo `contact_note` de máximo 19 caracteres en la pantalla Teléfonos. Se guarda al salir del campo.
- Vista rápida muestra la nota breve en el área Estado de llamadas; si no existe, muestra el teléfono.
- Añadida migración SQL `supabase/v10_10_migration.sql`.
- No se modifican las reglas de cálculo de Empresa 2 ni se incluye Empresa 1 en Vista rápida.
