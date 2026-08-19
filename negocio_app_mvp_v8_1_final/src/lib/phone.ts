export function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function formatPhone(value: string) {
  const digits = phoneDigits(value);
  if (!digits) return "";
  const area = digits.slice(0, 3);
  const middle = digits.slice(3, 6);
  const last = digits.slice(6, 10);

  if (digits.length <= 3) return `+1 (${area}`;
  if (digits.length <= 6) return `+1 (${area}) ${middle}`;
  return `+1 (${area}) ${middle}-${last}`;
}

export function completePhone(value: string) {
  return phoneDigits(value).length === 10;
}
