# Audit v8.3

- Base: v8.2.
- Bloc de Link convertido de una sola nota a notas independientes.
- Botón + crea una nota nueva.
- Cada nota tiene Guardar y Eliminar.
- Eliminar requiere confirmación explícita antes de borrar.
- Nueva tabla `link_bloc_notes` con RLS por usuario.
- No modifica la lógica de Agenda, Teléfonos, segunda orden, cierre, Link de clientes ni autenticación.
