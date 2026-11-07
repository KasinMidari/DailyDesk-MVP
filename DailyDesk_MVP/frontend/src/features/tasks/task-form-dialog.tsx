import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";
import { vi } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatShort, monthCaption, weekdayShort } from "@/lib/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABEL,
  STATUS_TEXT,
  STATUS_ORDER,
  type BoardSummary,
  type Priority,
  type Status,
  type Task,
  type TaskInput,
} from "./api";
import { validateTask, type FieldErrors } from "./logic";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  boards: BoardSummary[];
  defaultStatus?: Status;
  defaultBoardId?: string;
  /** Hạn chót gợi ý khi thêm task mới (ví dụ ngày được bấm trên lịch). */
  defaultDueAt?: string | null;
  saving: boolean;
  onSubmit: (input: TaskInput) => Promise<void>;
  onDelete?: () => void;
};

const PRIORITIES: Priority[] = ["high", "medium", "low"];

const BASE_TIMES = [
  ...Array.from({ length: 34 }, (_, i) => {
    const m = 6 * 60 + i * 30; // 06:00 → 22:30
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }),
  "23:59",
];

function toLocalParts(iso: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
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
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-[15px] shadow-[inset_0_1px_0_rgb(0_0_0/0.02)] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

/** Chấm màu của từng lựa chọn: trạng thái và độ ưu tiên dùng chung một bảng. */
const TONE: Record<string, string> = {
  todo: "bg-gray-400",
  doing: "bg-amber-500",
  done: "bg-emerald-500",
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-gray-400",
};

/**
 * Thanh chọn một-trong-nhiều.
 *
 * Rãnh chìm, ô đang chọn nổi lên bằng nền sáng + bóng nhẹ — cùng cách làm với
 * segmented control của shadcn. Bản cũ vẽ một ô tick lồng trong nút nên trạng
 * thái "đang chọn" phải tranh chỗ với ký hiệu của chính lựa chọn đó; giờ mỗi
 * lựa chọn chỉ còn một chấm màu, đang chọn thì ô nổi lên.
 */
export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  /** Giữ để tương thích; màu lấy theo giá trị. */
  tone?: (v: T) => string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="inline-grid auto-cols-max grid-flow-col justify-self-start gap-0.5 rounded-lg bg-muted p-1 max-[480px]:grid max-[480px]:auto-cols-fr max-[480px]:justify-self-stretch"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex h-8 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-full transition-opacity",
                TONE[o.value as string] ?? "bg-muted-foreground",
                active ? "opacity-100" : "opacity-50",
              )}
            />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const STATUS_DOT: Record<Status, string> = {
  todo: "bg-gray-400",
  doing: "bg-yellow-500",
  done: "bg-green-500",
};
export const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400",
};

export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
  boards,
  defaultStatus = "todo",
  defaultBoardId,
  defaultDueAt,
  saving,
  onSubmit,
  onDelete,
}: Props) {
  const id = useId();
  const isNew = !task;
  const titleRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [boardId, setBoardId] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const TIME_OPTIONS = time && !BASE_TIMES.includes(time) ? [...BASE_TIMES, time].sort() : BASE_TIMES;
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    const parts = toLocalParts(task ? task.dueAt : defaultDueAt ?? null);
    setName(task?.name ?? "");
    setDescription(task?.description ?? "");
    setDate(parts.date);
    setTime(parts.time);
    setPriority(task?.priority ?? "medium");
    setStatus(task?.status ?? defaultStatus);
    setBoardId(task?.boardId ?? defaultBoardId ?? boards[0]?.id ?? "");
    setErrors({});
    setSubmitError("");
  }, [open, task, defaultStatus, defaultBoardId, defaultDueAt, boards]);

  function dueIso() {
    if (!date) return null;
    const d = new Date(`${date}T${time || "23:59"}`);
    return Number.isNaN(d.getTime()) ? "invalid" : d.toISOString();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: TaskInput = {
      name: name.trim(),
      description: description.trim(),
      dueAt: dueIso(),
      priority,
      status,
      boardId,
    };
    // Khi sửa, chỉ báo lỗi hạn đã qua nếu người dùng đổi hạn.
    const dueChanged = !task || input.dueAt !== (task.dueAt ? new Date(task.dueAt).toISOString() : null);
    const found = validateTask(input, { isNew: isNew || dueChanged });
    setErrors(found);
    if (Object.keys(found).length) {
      if (found.name) titleRef.current?.focus();
      return;
    }
    setSubmitError("");
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Không lưu được task. Thử lại nhé.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader className="border-b px-6 pt-5 pb-4 text-left">
            <DialogTitle className="text-lg">{isNew ? "Thêm task mới" : "Sửa task"}</DialogTitle>
            <DialogDescription>
              {isNew ? "Chỉ tiêu đề là bắt buộc. Các ô khác có thể điền sau." : `Trong board ${task.boardName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[65svh] gap-5 overflow-y-auto px-6 py-5">
            <Field label="Tiêu đề" htmlFor={`${id}-name`} error={errors.name} hint={name.length > 160 ? `${name.length}/200` : undefined}>
              <input
                ref={titleRef}
                id={`${id}-name`}
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Nộp báo cáo tuần"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
                className={inputClass}
                maxLength={220}
              />
            </Field>

            {/* Hint "Không bắt buộc" chỉ xuất hiện một lần, ở trường Hạn chót ngay dưới. */}
            <Field label="Mô tả" htmlFor={`${id}-desc`} error={errors.description} hint={description ? `${description.length}/2000` : undefined}>
              <textarea
                id={`${id}-desc`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ghi chú thêm, đường link, các bước cần làm…"
                aria-invalid={!!errors.description}
                className={cn(inputClass, "h-auto min-h-20 resize-y py-2 leading-relaxed")}
              />
            </Field>

            <Field label="Hạn chót" htmlFor={`${id}-date`} error={errors.dueAt} hint={date ? (
              <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => { setDate(""); setTime(""); }}>
                Bỏ hạn
              </button>
            ) : "Không bắt buộc"}>
              <div className="grid grid-cols-[1fr_7.5rem] gap-2">
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      id={`${id}-date`}
                      type="button"
                      aria-invalid={!!errors.dueAt}
                      className={cn(inputClass, "flex items-center gap-2 text-left tabular")}
                    >
                      <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {date ? (
                        formatShort(new Date(`${date}T00:00`))
                      ) : (
                        <span className="text-muted-foreground">Chọn ngày</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      locale={vi}
                      weekStartsOn={1}
                      formatters={{ formatCaption: (d) => monthCaption(d), formatWeekdayName: (d) => weekdayShort(d) }}
                      selected={date ? new Date(`${date}T00:00`) : undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        setDate(toLocalParts(d.toISOString()).date);
                        if (!time) setTime("17:00");
                        setPickerOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <select
                  aria-label="Giờ"
                  value={time || "23:59"}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={!date}
                  className={cn(inputClass, "tabular disabled:opacity-50")}
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t === "23:59" ? "Cuối ngày" : t}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <Field label="Độ ưu tiên">
              <Segmented
                name="Độ ưu tiên"
                value={priority}
                onChange={setPriority}
                options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
                tone={(p) => PRIORITY_DOT[p]}
              />
            </Field>

            <Field label="Trạng thái">
              <Segmented
                name="Trạng thái"
                value={status}
                onChange={setStatus}
                options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_TEXT[s] }))}
                tone={(s) => STATUS_DOT[s]}
              />
            </Field>

            {/* Luôn hiện, kể cả khi chỉ có một board: task nào cũng phải nằm trong
                một board, nên lúc tạo phải thấy nó vào đâu. */}
            {isNew && boards.length > 0 && (
              <Field label="Lưu vào board" htmlFor={`${id}-board`} error={errors.boardId}>
                {/* Mũi tên vẽ bằng icon theo currentColor, không phải SVG mã cứng một màu. */}
                <div className="relative">
                  <select
                    id={`${id}-board`}
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    className={cn(inputClass, "appearance-none pr-9")}
                  >
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </Field>
            )}

            {submitError && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            )}
          </div>

          <DialogFooter className="flex-row items-center border-t px-6 py-4 sm:justify-between">
            {!isNew && onDelete ? (
              <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
                Xoá task
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={saving} className="min-w-28">
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isNew ? "Thêm task" : "Lưu thay đổi"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
