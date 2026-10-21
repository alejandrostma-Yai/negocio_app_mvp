# Financia Flow v10.11

- Vista rápida: lista de citas del día en una sola columna vertical.
- Meta diaria: cuenta citas creadas en el día actual (created_at en la zona horaria de Santo Domingo), aunque la fecha programada sea otra.
- Fecha de Vista rápida: detecta cambio de día y recarga los datos automáticamente cada 30 segundos, con lo que las citas mostradas cambian al nuevo día después de medianoche en Santo Domingo.
- Migración SQL: agrega `sales.contact_note` si todavía no existe, corrigiendo el error mostrado en las capturas.

No se ha afirmado una compilación local verificada.
