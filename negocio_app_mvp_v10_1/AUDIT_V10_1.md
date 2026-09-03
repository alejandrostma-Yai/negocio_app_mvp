# Financia Flow v10.1

Corrección de scroll:

- Se eliminó el bloqueo global `html, body { overflow:hidden }` que afectaba Inicio, Agenda y demás páginas en iPad horizontal.
- El bloqueo de scroll en landscape ahora se aplica únicamente cuando `body` contiene `.v96-shell`, es decir, la ruta de Vista rápida.
- Se mantienen intactos los cambios de v10: Meta en porcentaje, potencial en porcentaje y barra arcoíris.
- No requiere SQL.
