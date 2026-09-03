# AUDIT V9

## Cambio único
Se agregó la posibilidad de **agregar dinero manualmente al Capital de trabajo**.

## Comportamiento
- El aporte manual aumenta únicamente `wallets.working_capital`.
- No modifica el Monto bruto de hoy.
- No entra al flujo de cierre ni se divide entre Capital, Casa y Meta.
- Se registra en `capital_movements` y en `transaction_history` como `aporte_capital`.
- Se conserva intacta la opción de retirar Capital.
- En la pantalla Capital ahora se puede elegir entre `Agregar dinero` y `Retirar`.

## Base
Esta versión parte de `negocio_app_mvp_v8_10` y conserva sus demás cambios.
