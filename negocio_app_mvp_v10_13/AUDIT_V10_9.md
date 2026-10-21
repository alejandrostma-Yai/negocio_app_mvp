# Financia Flow v10.9

## Vista rápida (Empresa 2)
- Added `Citas totales en el sistema`, counting all non-deleted Company 2 sales/appointments for the signed-in user.
- Added `Monto bruto generado este mes`, cumulatively summing the prices of Company 2 sales with `status = completada` whose `completed_at` falls within the current month in Santo Domingo time.
- Kept the daily gross amount as the lead metric and preserved all existing v10.8 quick-view features.
- No database schema changes; no new SQL migration required.

## Verification
- Static inspection confirms all-time and month queries are Company 2 scoped.
- Full production build should be verified by Vercel after deployment.
