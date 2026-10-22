# Financia Flow v10.16
- Based on v10.15 application source.
- Main dashboard no longer displays expense total or inline expense form; it links to /gastos.
- /gastos displays gross sales, period expenses, available gross, and withdrawal history for Company 2.
- Period follows settings.close_mode (daily/weekly).
- SQL migration creates business_expenses, RLS policies, close snapshots, expense registration RPC, and updates close functions.
- Gross sales remain unchanged; expenses are deducted from available gross and from the distributable amount at close.
- SQL should be run in Supabase before deployment.
