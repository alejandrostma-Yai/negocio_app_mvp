# AUDIT V8.6

- Cierre configurable: diario o semanal (lunes a domingo).
- El cierre solo toma ventas con status `completada`, es decir, cobradas. Pendiente y pendiente_pago no se calculan.
- El cierre semanal evita doble distribución si existen cierres diarios en la misma semana.
- Bloc movido a Inicio, junto al saludo.
- Notas del Bloc con guardado automático.
- Contador manual +1 con reinicio y cronómetro con iniciar/pausar/reiniciar.
