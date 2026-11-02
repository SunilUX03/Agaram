import i18n from 'i18next';

const TZ = 'Asia/Kolkata';

/** The date locale for the chosen language: English uses en-IN, Tamil uses ta-IN, nothing else. */
export const dateLocale = (language?: string) =>
  (language ?? i18n.language ?? 'en').toLowerCase().startsWith('ta') ? 'ta-IN' : 'en-IN';

export function parseDMY(text: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
    ? date
    : null;
}

export const pad = (n: number) => String(n).padStart(2, '0');

export function formatDMY(date: Date): string {
  return `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}

/** "12 Nov 2026" in the active locale, Asia/Kolkata. */
export function formatDate(value: Date | string | number, locale?: string): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(value));
}

/** "3:05 PM" in 12-hour form, Asia/Kolkata. */
export function formatTime(value: Date | string | number, locale?: string): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TZ,
  })
    .format(new Date(value))
    .replace(/[\u202f\u00a0]/g, ' ')
    .toUpperCase();
}

/** ₹12,50,000 with Indian digit grouping. */
export function formatINR(amount: number, locale = 'en-IN'): string {
  return `₹${new Intl.NumberFormat(locale).format(amount)}`;
}

export const rangesOverlap = (aFrom: Date, aTo: Date, bFrom: Date, bTo: Date) =>
  aFrom <= bTo && bFrom <= aTo;
