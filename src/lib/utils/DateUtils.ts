const pad = (n: number) => String(n).padStart(2, '0');

/** Fixed "YYYY-MM-DD HH:mm" format, independent of the browser's locale. */
export const formatDateTime = (date: string | number | Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Fixed "YYYY-MM-DD" format, independent of the browser's locale. */
export const formatDate = (date: string | number | Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** "YYYY-MM-DDTHH:mm" in local time, for seeding <input type="datetime-local">. */
export const toDateTimeLocalInput = (date: string | number | Date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Parse a "YYYY-MM-DD" (from <input type="date">) as local midnight, not UTC. */
export const fromDateInput = (value: string) => new Date(`${value}T00:00`);

/**
 * The week a date falls in, as the "YYYY-MM-DD" of its Monday in UTC. Weeks
 * run Monday 00:00 UTC to Sunday 23:59 UTC, like the BTC weekly candle.
 */
export const toWeekStart = (date: string | number | Date) => {
  const d = new Date(date);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysSinceMonday),
  );
  return monday.toISOString().slice(0, 10);
};

/** "YYYY-MM-DD" shifted by whole days, e.g. a week start to its Sunday. */
export const addDays = (day: string, days: number) => {
  const d = new Date(`${day}T00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
