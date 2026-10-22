# Auditoría v8.8

- Base: v8.7.
- Añadido navegador temporal desde Link mediante icono pequeño.
- No se persiste URL ni historial en localStorage/Supabase.
- Si el servidor remoto declara X-Frame-Options o CSP frame-ancestors incompatibles, se muestra error dentro de la app y no se abre Safari.
- Se añadió comprobación servidor-side con bloqueo de hosts/IP privadas para reducir riesgo SSRF.
- Login actualizado para coincidir con la estética tecnológica moderna de la app.
- No requiere migración SQL nueva.
