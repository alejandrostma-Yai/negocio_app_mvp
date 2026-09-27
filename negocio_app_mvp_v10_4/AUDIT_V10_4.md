# Financia Flow v10.4

## Cambio principal
- Nueva versión de aplicación: 10.4.0.
- Se mantiene el soporte de dos empresas de v10.3.
- Empresa 1 (verde) queda fuera de los cálculos financieros.
- Empresa 2 (azul) mantiene el flujo financiero normal.

## Corrección de compilación
- `src/app/vista/page.tsx` declara `company_id?: 1 | 2` en el tipo `Sale`, necesario para el filtro de citas pendientes de Empresa 2.
- Se conserva el selector de empresa y las etiquetas de color de v10.3.

## Despliegue Vercel
- Root Directory: `negocio_app_mvp_v10_3` cuando el repositorio contiene el proyecto dentro de esa carpeta.
- Build Command: `npm run build`.
- No requiere una nueva migración SQL para este cambio de versión; debe haberse ejecutado la migración v10.3 para la columna `company_id`.
