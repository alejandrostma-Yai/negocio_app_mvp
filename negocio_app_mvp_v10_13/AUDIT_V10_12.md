# Financia Flow v10.12

- Fuerza la lista de citas de Vista rápida a una sola columna en todos los tamaños de pantalla.
- La meta diaria usa las citas creadas hoy según created_at y el día de República Dominicana, independientemente de la fecha programada.
- En Estado de llamadas, teléfono y nota se muestran en renglones separados; la nota ya no sustituye al número.
- No requiere una migración SQL adicional respecto a v10.11; contact_note debe existir en Supabase mediante la migración v10.11.

Verificación: inspección estática de los cambios. No se ejecutó un build de Next.js en este entorno.
