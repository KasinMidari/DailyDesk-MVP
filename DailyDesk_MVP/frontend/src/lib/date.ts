import { format as dfFormat } from "date-fns";
import { vi } from "date-fns/locale";

/** format của date-fns, mặc định dùng tiếng Việt. */
export function format(date: Date | number | string, pattern: string, options?: Parameters<typeof dfFormat>[2]) {
  return dfFormat(date, pattern, { locale: vi, ...options });
}

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const pad = (n: number) => String(n).padStart(2, "0");

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Ngày ngắn dùng chung cho mọi màn: "Hôm nay", "Ngày mai", "T4, 4/11", "T4, 4/11/2027". */
export function formatShort(input: Date | string) {
  const d = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return "Hôm nay";
  if (sameDay(d, tomorrow)) return "Ngày mai";
  const year = d.getFullYear() === now.getFullYear() ? "" : `/${d.getFullYear()}`;
  return `${WEEKDAY[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}${year}`;
}

/** Ngày + giờ 24h: "Hôm nay, 17:00", "T4, 4/11, 17:00". */
export function formatDue(input: Date | string) {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${formatShort(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
