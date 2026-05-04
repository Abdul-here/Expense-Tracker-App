/**
 * Display amounts without ".00" for whole numbers; keep two decimals when there are cents.
 */
export function formatMoneyDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const cents = Math.round(Math.abs(n) * 100);
  if (cents % 100 === 0) {
    const whole = cents / 100;
    const out = Math.sign(n) * whole;
    return out.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  const withFraction = cents / 100;
  const signed = Math.sign(n) * withFraction;
  return signed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Value for `<input type="number" step="any">` when prefilling an edit */
export function formatAmountForInput(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const cents = Math.round(n * 100);
  if (cents % 100 === 0) return String(Math.trunc(cents / 100));
  return (cents / 100).toFixed(2);
}
