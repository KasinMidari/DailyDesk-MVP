import { format as dfFormat } from "date-fns";
import { vi } from "date-fns/locale";

/** format của date-fns, mặc định dùng tiếng Việt. */
export function format(date: Date | number | string, pattern: string, options?: Parameters<typeof dfFormat>[2]) {
  return dfFormat(date, pattern, { locale: vi, ...options });
}
