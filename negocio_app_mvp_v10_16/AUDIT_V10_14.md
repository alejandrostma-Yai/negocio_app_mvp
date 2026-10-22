# Financia Flow v10.14

## Corrección de empaquetado para Vercel
- El proyecto completo está dentro de la carpeta `negocio_app_mvp_v10_14/` en el ZIP.
- En Vercel, Root Directory debe ser exactamente `negocio_app_mvp_v10_14`.
- `package.json` está en la raíz de esa carpeta, junto a `src/`, `supabase/` y los archivos de configuración.
- Conserva la migración SQL v10.13 ya entregada; este cambio corrige el empaquetado/Root Directory, no requiere otra migración.

## Verificación
- Revisada la estructura del ZIP y presencia de `package.json`, `src/app`, `supabase` y `next.config.ts`.
- No se afirma una compilación de Next.js: debe confirmarse en Vercel tras el push.
