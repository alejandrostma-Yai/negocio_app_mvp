// v9.7 — Una sola fuente de verdad para privacidad de montos.
// Inicio puede guardar/cambiar esta clave y Vista rápida la refleja.
export const AMOUNT_PRIVACY_KEY = 'ff_amounts_hidden';

export function getAmountsHidden(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(AMOUNT_PRIVACY_KEY) === '1';
}

export function setAmountsHidden(hidden: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AMOUNT_PRIVACY_KEY, hidden ? '1' : '0');
  window.dispatchEvent(new CustomEvent('ff-amount-privacy', { detail: hidden }));
}

export function maskMoney(value: string | number, hidden: boolean) {
  return hidden ? 'RD$••••••' : (typeof value === 'number'
    ? `RD$${value.toLocaleString('es-DO')}`
    : value);
}
