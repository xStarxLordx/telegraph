/**
 * Formats a tweet's date and time for the active language, e.g. "12/10/2026, 09:58" (es)
 * or "10/12/2026, 09:58 AM" (en). `locale` is the i18next language code; `timeZone` defaults to
 * the browser's (fixed in tests).
 */
export default function formatDateTime(date: Date, locale: string, timeZone?: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}
