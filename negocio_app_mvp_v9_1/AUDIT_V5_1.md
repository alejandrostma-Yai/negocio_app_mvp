# Auditoría V5.1

Cambios principales:
- Añadido cierre del día desde Inicio con resumen antes de confirmar.
- Regla fija de capital: RD$2,705 por cada venta completada del día.
- Regla de Casa: hasta RD$3,000 una sola vez por día.
- El resto del bruto se asigna a la meta financiera.
- El cierre usa únicamente ventas con estado `completada` de la fecha del cierre.
- Protección contra doble cierre: un mismo día no se puede distribuir dos veces.
- Si la configuración exige cero pendientes, Supabase bloquea el cierre mientras queden ventas pendientes de ese día.
- No se modifican Agenda, Teléfonos, Meta diaria ni las funciones de V5.

Antes de desplegar V5.1 hay que ejecutar `supabase/v5_1_migration.sql` en Supabase SQL Editor.
