/** Format an ISO-ish timestamp like "2026-03-10T13:16:37.624000" to "2026-03-10 13:16". */
export function formatTimestamp(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
