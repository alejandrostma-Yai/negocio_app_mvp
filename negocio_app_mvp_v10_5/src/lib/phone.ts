export function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function formatPhone(value: string) {
  const raw = value.trim();
  const hasCountryCode = /^\+?1(?:\D|$)/.test(raw);
  const digits = phoneDigits(raw);
  if (!digits) return hasCountryCode ? "+1" : "";

  const area = digits.slice(0, 3);
  const middle = digits.slice(3, 6);
  const last = digits.slice(6, 10);
  const formatted = digits.length <= 3
    ? area
    : digits.length <= 6
      ? `${area} ${middle}`
      : `${area} ${middle}-${last}`;

  // Do not insert +1 unless the user actually entered the country code.
  return hasCountryCode ? `+1 ${formatted}` : formatted;
}

export function completePhone(value: string) {
  return phoneDigits(value).length === 10;
}
