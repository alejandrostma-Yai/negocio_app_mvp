# AUDIT V9.2

## Vista rápida / protector de pantalla
- Se añadió un botón circular en la barra superior del Inicio, antes de **Salir**.
- El botón abre `/vista`; el Inicio original no se reemplaza.
- La vista rápida muestra monto bruto, Capital, Casa, progreso de meta diaria y meta financiera.
- Tiene accesos circulares a Citas del día, Pendientes de llamar y notas del Bloc.
- Ninguna lista se abre por defecto.
- Al tocar una lista, se despliega entre el panel circular y los contadores de cierre. Solo una lista puede estar abierta a la vez.
- Pendientes de llamar muestra solamente citas del día actual con teléfono y estado pendiente.
- Notas muestra notas del Bloc actualizadas durante el día actual.
- Incluye simultáneamente cuenta regresiva para cierre diario y semanal.
- Usa Realtime existente para refrescar los datos entre dispositivos.
- No requiere migración SQL nueva; usa las tablas ya incluidas en v9.1.
