# Control de Negocio — MVP

Versión 4 del proyecto web responsive para móvil y iPad.

## Incluye
- Panel principal con monto bruto, capital, casa, meta y meta diaria.
- Agenda y formulario de nueva venta.
- Historial.
- Configuración editable de materias primas, casa y metas.
- Capital de trabajo con bloqueo para evitar saldo negativo.
- Esquema Supabase con RLS por usuario.
- Cierre diario con reposición de capital, aporte parcial a casa y aporte a meta.
- Datos de cada cuenta separados mediante `auth.uid()`.

## Regla financiera actual
Costo de reposición por unidad = MP1 + MP2 + MP3.
Al cerrar el día:
1. Cuenta ventas completadas.
2. Calcula monto bruto.
3. Reserva el costo de reposición de cada unidad y lo suma al capital de trabajo.
4. Separa hasta el monto diario configurado para casa. Si no alcanza, registra parcial.
5. El resto se suma a la meta.

Los costos y metas se pueden modificar desde configuración y deben aplicarse hacia adelante.

## Para conectarlo
1. Ejecuta `supabase/schema.sql` en el SQL Editor de tu proyecto Supabase.
2. Copia `.env.local.example` a `.env.local`.
3. Coloca tu `NEXT_PUBLIC_SUPABASE_URL` y tu publishable key.
4. Instala dependencias: `npm install`.
5. Ejecuta localmente: `npm run dev`.
6. Luego importa el repositorio en Vercel.

## Versión 4
- Nueva venta guarda realmente en Supabase.
- Agenda carga las ventas por fecha y permite completar o cancelar ventas pendientes.
- Inicio muestra saldos, ventas del día, meta y actividad real desde Supabase.
- Historial lee movimientos reales y permite buscar.
- Configuración carga y guarda los valores reales del usuario.
- Capital y Casa muestran saldos reales y registran movimientos.
- No requiere cambios al esquema SQL existente para estas correcciones.


## Acceso
- Las rutas principales están protegidas por sesión.
- Sin sesión, la app redirige a `/login`.
- El login muestra `by Alejandro Sánchez` en el pie.

- Registro protegido con código de invitación `YAI1998`.

## V5

Antes de usar V5 en producción, ejecuta `supabase/v5_migration.sql` en Supabase SQL Editor. Agrega la columna opcional `phone` a `sales` sin borrar datos existentes.

Novedades: teléfono en citas, pestaña Teléfonos con búsqueda parcial, calendario mensual en Agenda, contador global de pendientes al pie de Inicio y meta diaria basada en citas nuevas creadas ese día.
