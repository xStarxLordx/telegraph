/**
 * Formats a tweet's date and time for the active language, e.g. "12/10/2026, 09:58" (es)
 * or "10/12/2026, 09:58 AM" (en).
 * @param {Date} date
 * @param {string} locale i18next language code.
 * @param {string} [timeZone] Defaults to the browser's; fixed in tests.
 */
export default function formatDateTime(date, locale, timeZone = undefined) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(date);
}
