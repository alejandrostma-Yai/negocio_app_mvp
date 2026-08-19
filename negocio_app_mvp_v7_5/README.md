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

## V5.1 — Cierre diario

V5.1 añade el botón **Cerrar día** en Inicio. El cierre distribuye el bruto de las ventas completadas de la fecha así:

- RD$2,705 × cada venta completada → Capital de trabajo.
- Hasta RD$3,000 una sola vez al día → Fondo de casa.
- Resto → Meta financiera.

Ejecuta `supabase/v5_1_migration.sql` en Supabase antes de usar el cierre diario.


## V5.2
- En Inicio, la tarjeta **Meta financiera** ya no muestra el saldo acumulado ni el monto total de la meta.
- Ahora muestra únicamente el **porcentaje de avance** y una barra de progreso.
- Los montos siguen guardados internamente y se usan para calcular el porcentaje.
- No requiere cambios adicionales en Supabase.

## v5.3

- Cierre diario configurable mediante materias primas y monto de Casa.
- Inicio simplificado para el cierre del día.
- Casa fuera de la navegación superior.
- Retiros de Capital de trabajo y Casa desde sus tarjetas en Inicio.

Para una base ya existente, ejecutar `supabase/v5_3_migration.sql` en Supabase SQL Editor antes de usar los retiros o el nuevo cierre.


## Versión 6

- Modificación de citas pendientes desde Agenda.
- Reubicación automática al cambiar fecha u hora.
- Acciones Completar/Cancelar reforzadas para evitar cambios sobre citas que ya dejaron de estar pendientes.
- Nueva venta desde Agenda conserva la fecha seleccionada.
- No requiere SQL adicional respecto a v5.3.


## Versión 7 — Estética premium OG

- Nueva identidad visual OG con estilo azul noche/negro y dorado.
- Tema oscuro premium por defecto y opciones Claro / Oscuro / Sistema desde Configuración.
- Nueva marca OG en login y navegación, con icono SVG de la app.
- Barra de Meta financiera con mayor contraste, brillo dorado y animación suave.
- Tarjetas, botones, calendario, teléfonos e historial con diseño móvil premium.
- Navegación con estado activo y mejor adaptación a iPhone.
- Orden de acciones en Agenda: Completar → Modificar → Cancelar.
- Opción Cambiar contraseña en Configuración.
- No requiere SQL adicional respecto a v5.3.
- La preferencia de tema se guarda en el dispositivo/navegador.


## v7.1
- Capital de trabajo y Casa aparecen lado a lado en Inicio.
- Meta financiera aparece debajo ocupando el ancho completo.
- El cierre del día se presenta como un único botón dorado `Cerrar día`.

## v7.2
- Vista previa de cierre con confirmación.
- Icono OG para pantalla de inicio.
- Defaults en cero para nuevos usuarios (ver `supabase/v7_2_migration.sql`).


## v7.4
- Nueva pestaña **Link** con todas las citas pendientes.
- Nota individual por cliente/cita, con botones Guardar y Copiar.
- Las notas desaparecen de Link al completar o cancelar la cita y se limpia `link_note`.
- Ejecutar `supabase/v7_3_migration.sql` antes de usar esta función.

## v7.5
- Branding visual actualizado a **Control de Negocio**.
- Lema: **Controla, Planifica, Alcanza tu Meta**.
- Menú principal inferior con iconos.
- Login premium transparente conserva el fondo visual.
- Mantiene saludo personalizado y funciones anteriores.
