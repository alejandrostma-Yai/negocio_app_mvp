# Auditoría previa a versión 4

Se revisaron las pantallas y servicios incluidos en la versión 3 antes de generar esta versión.

## Errores funcionales corregidos
- El botón **Guardar venta** no ejecutaba ninguna acción. Ahora crea la venta en Supabase y vuelve a Agenda.
- **Agenda** era una maqueta. Ahora consulta ventas por fecha y permite completar o cancelar ventas pendientes.
- **Inicio** usaba valores de demostración. Ahora carga saldos, meta, ventas del día y actividad desde Supabase.
- **Historial** era una maqueta. Ahora carga movimientos reales y permite buscar.
- **Configuración** no guardaba. Ahora carga y actualiza la fila `settings` del usuario.
- **Capital** no guardaba. Ahora permite agregar capital al saldo y registra el movimiento en historial.
- **Casa** ahora muestra el fondo disponible y bloquea gastos mayores al saldo disponible.
- El cliente Supabase de **Login** se recreaba en cada render y podía repetir la comprobación de sesión. Ahora se mantiene estable.
- El script `lint` del paquete fue reemplazado por una comprobación TypeScript (`tsc --noEmit`).

## Verificaciones realizadas
- Todos los archivos TypeScript/TSX fueron analizados sintácticamente sin errores.
- Se revisaron botones sin acción y textos de maqueta en las pantallas principales.
- No se requieren cambios al SQL existente para las correcciones de esta versión.

## Limitación conocida
El código de invitación `YAI1998` se valida en el navegador. Sirve para el flujo normal de registro, pero no constituye una barrera de seguridad contra alguien que intente llamar directamente a Supabase. Endurecer esto requeriría configuración adicional del lado servidor/Supabase.
