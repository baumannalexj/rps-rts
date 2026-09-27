/** Number and time formatting shared by presenters and charts. Pure. */

/** Game seconds as m:ss. Fractions are floored. */
export function fmtTime(ticks: number): string {
  const t = Math.max(0, Math.floor(ticks));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Prototype rule: magnitudes >= 100 get no decimals, otherwise `digits` decimals. */
export function fmtNum(value: number, digits = 1): string {
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(digits);
}

/** Integer with a "k" suffix from 1000 up (e.g. 1.2k). */
export function fmtCompact(value: number): string {
  return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
}

/** Axis tick label: k-suffix from 1000, one decimal for fractions, integers as-is. */
export function fmtAxis(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value % 1 ? value.toFixed(1) : String(value);
}

export function fmtPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** First letter, upper-cased ("water" -> "W"). */
export function initial(text: string): string {
  return text.slice(0, 1).toUpperCase();
}
