# Auditoría v5.3

Cambios principales:

- Casa ya no aparece en la navegación superior.
- Capital de trabajo y Casa aparecen en Inicio con botón **Retirar**.
- Los retiros de ambos fondos son transacciones atómicas en Supabase y validan saldo disponible.
- El cierre del día se muestra en Inicio de forma compacta: texto **Cierre del día** y botón **Cerrar día**, sin enseñar la distribución de montos.
- El capital de reposición del cierre se calcula con `mp1 + mp2 + mp3` de Configuración por cada venta completada.
- El aporte diario de Casa usa `daily_house_amount` de Configuración.
- El resto del monto bruto se destina a la meta financiera.
- Se incluye `supabase/v5_3_migration.sql` para actualizar una base existente.

No se modificó la lógica de Agenda, Teléfonos, meta diaria ni el contador de pendientes.
