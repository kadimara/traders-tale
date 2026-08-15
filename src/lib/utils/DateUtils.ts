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
