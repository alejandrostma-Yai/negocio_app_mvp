# AUDIT V8

- Base: v7.5.
- Added independent privacy eye toggles for Monto bruto, Capital de trabajo and Casa.
- Hidden amounts render as RD$•••••• and each preference persists locally on the device.
- Logout remembers the last user's display name and email locally so the next login shows the name and requests only the password.
- Password is never stored by the app.
- Added “Cambiar usuario” to clear remembered user information and return to full email + password login.
- No database migration required.
