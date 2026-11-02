import type { DueStatusResult } from "@/types/card";

const HOURS_24 = 24 * 60 * 60 * 1000;

export function getDueStatus(
  dueAt: Date | string | null | undefined,
  dueComplete: boolean = false,
  now: Date = new Date()
): DueStatusResult {
  if (!dueAt) {
    return {
      status: "none",
      label: "",
      color: "default",
    };
  }

  const dueDate = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const nowTime = now.getTime();
  const dueTime = dueDate.getTime();
  const diff = dueTime - nowTime;

  if (dueComplete) {
    return {
      status: "complete",
      label: "Đã xong",
      color: "success",
    };
  }

  if (diff < 0) {
    return {
      status: "overdue",
      label: "Quá hạn",
      color: "destructive",
    };
  }

  if (diff <= HOURS_24) {
    return {
      status: "dueSoon",
      label: "Sắp đến hạn",
      color: "warning",
    };
  }

  return {
    status: "dueLater",
    label: "",
    color: "secondary",
  };
}

export function formatDueDate(dueAt: Date | string | null | undefined): string {
  if (!dueAt) return "";

  const date = typeof dueAt === "string" ? new Date(dueAt) : dueAt;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isSameYear = date.getFullYear() === now.getFullYear();

  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const hasTime = hours !== "00" || minutes !== "00";

  if (isToday && hasTime) {
    return `Hôm nay, ${hours}:${minutes}`;
  }

  if (isToday) {
    return "Hôm nay";
  }

  let result = `${day} thg ${date.getMonth() + 1}`;

  if (!isSameYear) {
    result += `, ${date.getFullYear()}`;
  }

  if (hasTime) {
    result += `, ${hours}:${minutes}`;
  }

  return result;
}

export const REMINDER_OPTIONS = [
  { value: null, label: "Không nhắc" },
  { value: 1, label: "Trước 1 phút" },
  { value: 5, label: "Trước 5 phút" },
  { value: 10, label: "Trước 10 phút" },
  { value: 15, label: "Trước 15 phút" },
  { value: 30, label: "Trước 30 phút" },
  { value: 60, label: "Trước 1 giờ" },
  { value: 120, label: "Trước 2 giờ" },
  { value: 1440, label: "Trước 1 ngày" },
] as const;
