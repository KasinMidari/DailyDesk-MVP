/**
 * Trường của hộp thoại thẻ: nhãn trên, lỗi dưới — cùng hình dạng với form task
 * ở "Việc của tôi" (`features/tasks/task-form-dialog.tsx`), để một task chỉ có
 * một bộ mặt dù mở từ danh sách hay từ board.
 */
import type { ReactNode } from "react";
import {
  PRIORITY_LABEL,
  STATUS_TEXT,
  STATUS_ORDER,
  type Priority,
  type Status,
} from "@/features/tasks/api";
import { Segmented } from "@/features/tasks/task-form-dialog";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

export function CardField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs text-muted-foreground tabular">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Độ ưu tiên và trạng thái: chỉ ghi vào bản nháp, không tự gửi lên backend. */
export function CardPriorityField({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (next: Priority) => void;
}) {
  return (
    <CardField label="Độ ưu tiên">
      <Segmented
        name="Độ ưu tiên"
        value={value}
        onChange={onChange}
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
      />
    </CardField>
  );
}

export function CardStatusField({
  value,
  onChange,
}: {
  value: Status;
  onChange: (next: Status) => void;
}) {
  return (
    <CardField label="Trạng thái">
      <Segmented
        name="Trạng thái"
        value={value}
        onChange={onChange}
        options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_TEXT[s] }))}
      />
    </CardField>
  );
}
