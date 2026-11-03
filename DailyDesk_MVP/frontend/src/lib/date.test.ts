import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDue, formatShort, formatWeekdayDate, monthCaption, weekdayShort } from "./date";

describe("định dạng ngày dùng chung", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T10:00:00")); // Thứ Tư
  });
  afterEach(() => vi.useRealTimers());

  it("Hôm nay / Ngày mai", () => {
    expect(formatShort(new Date("2026-11-04T18:00:00"))).toBe("Hôm nay");
    expect(formatShort(new Date("2026-11-05T08:00:00"))).toBe("Ngày mai");
  });

  it("thứ viết tắt và ngày/tháng; khác năm thêm năm", () => {
    expect(formatShort(new Date("2026-11-09T08:00:00"))).toBe("T2, 9/11");
    expect(formatShort(new Date("2026-11-08T08:00:00"))).toBe("CN, 8/11");
    expect(formatShort(new Date("2027-01-02T08:00:00"))).toBe("T7, 2/1/2027");
  });

  it("giờ 24h", () => {
    expect(formatDue(new Date("2026-11-06T17:05:00"))).toBe("T6, 6/11, 17:05");
    expect(formatDue("2026-11-04T09:00:00")).toBe("Hôm nay, 09:00");
  });

  it("tiêu đề ngày, tháng, thứ", () => {
    expect(formatWeekdayDate(new Date("2026-11-04T10:00:00"))).toBe("Thứ Tư, 4/11");
    expect(monthCaption(new Date("2026-11-04T10:00:00"))).toBe("Tháng 11, 2026");
    expect(weekdayShort(new Date("2026-11-08T10:00:00"))).toBe("CN");
  });
});
