# Financia Flow v10.13

- Added configurable fund names and percentages in Settings.
- Defaults: `Capital del negocio` 50%, `Casa` 50%.
- Daily and weekly closing now calculates the gross amount for completed Company 2 sales, deducts configured raw-material cost (MP1+MP2+MP3 per completed order), then splits the remainder using the configured percentages.
- No remaining amount is allocated to Meta by the close function.
- Dashboard close preview shows raw-material costs and both configured fund allocations.
- Dashboard cards and fund pages use the configured names.
- Added `supabase/v10_13_migration.sql`; run it in Supabase before deploying this version.
