# Financia Flow v10

## Verificaciones y cambios
- Base: v9.9.
- Meta financiera en Vista rápida no muestra ningún monto en RD$.
- Solo muestra porcentaje actual, aumento potencial en porcentaje y porcentaje proyectado.
- El potencial usa la misma fórmula del cierre diario de Supabase: bruto - (órdenes × (MP1+MP2+MP3)) - Casa = Meta.
- Casa se descuenta con `min(daily_house_amount, bruto - capital)`, igual que `close_business_day`.
- Barra de Meta más ancha y gruesa, con degradado tipo arcoíris.
- Conserva privacidad de Bruto/Capital/Casa compartida con Inicio.
- Conserva ajuste de iPad horizontal, Realtime, cierres y Enfoque.
- No requiere SQL nuevo.
