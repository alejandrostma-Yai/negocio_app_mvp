# Control de Negocio — MVP

Primera versión del proyecto web responsive para móvil y iPad.

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

## Importante
Esta es una base funcional inicial. Las pantallas están preparadas y el esquema de datos ya refleja las reglas principales. El próximo bloque de desarrollo debe conectar los formularios con Supabase, completar autenticación, agenda real, drag & drop, cierre visual del día y edición/auditoría.


## Acceso
- Las rutas principales están protegidas por sesión.
- Sin sesión, la app redirige a `/login`.
- El login muestra `by Alejandro Sánchez` en el pie.

- Registro protegido con código de invitación `YAI1998`.
