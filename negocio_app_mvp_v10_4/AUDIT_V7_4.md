# AUDIT V7.4

## Cambios
- Login premium con imagen de fondo inspirada en la referencia del usuario.
- Panel de login transparente con efecto glassmorphism.
- Mantiene login y registro con Supabase Auth.
- Inicio muestra `Hola, [nombre]` debajo del menú.
- El nombre se toma de `user_metadata.full_name`; si no existe, usa la parte del correo antes de `@`.
- Conserva Link, correo, cierre diario, teléfonos, agenda, historial y configuración de v7.3.

## Seguridad
- No se añadió ninguna clave administrativa ni service-role al frontend.
- El flujo de autenticación sigue usando la clave pública/publishable configurada en variables de entorno.
