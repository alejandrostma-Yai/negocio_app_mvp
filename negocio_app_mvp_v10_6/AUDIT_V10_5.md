# Financia Flow v10.5

## Phone number correction
- Phone entry no longer automatically inserts `+1`.
- If the user types only the 10 local digits, they remain the 10 local digits (formatted as `612 222-3125`).
- If the user explicitly types `+1`, the country code is preserved and formatting becomes `+1 612 222-3125`.
- Existing saved numbers with `+1` continue to display correctly.
- Validation still requires 10 local digits.

## Preserved
- v10.4 functionality, including the two-company model.
