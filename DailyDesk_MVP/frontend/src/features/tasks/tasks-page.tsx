import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import {
  CalendarClock,
  ChevronDown,
  CircleAlert,
  MoreHorizontal,
  Plus,
  Search,
  SearchX,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  useBoardsSummary,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  type Priority,
  type Status,
  type Task,
  type TaskInput,
} from "./api";
import { GROUP_LABEL, compare, groupTasks, isOverdue, matches, type Filters, type SortKey } from "./logic";
import TaskFormDialog, { PRIORITY_DOT, STATUS_DOT } from "./task-form-dialog";

const SORT_LABEL: Record<SortKey, string> = {
  deadline: "Hạn gần nhất",
  "deadline-desc": "Hạn xa nhất",
  priority: "Ưu tiên cao trước",
  newest: "Mới tạo",
};

const STATUS_TEXT: Record<Status, string> = {
  todo: "text-status-todo",
  doing: "text-status-doing",
  done: "text-status-done",
};
const STATUS_SOFT: Record<Status, string> = {
  todo: "bg-status-todo-soft",
  doing: "bg-status-doing-soft",
  done: "bg-status-done-soft",
};

function dueText(iso: string) {
  const d = new Date(iso);
  const hm = format(d, "HH:mm");
  if (isToday(d)) return `Hôm nay, ${hm}`;
  if (isTomorrow(d)) return `Ngày mai, ${hm}`;
  return format(d, "EEE d/M, HH:mm", { locale: vi });
}

function useFilters() {
  const [params, setParams] = useSearchParams();
  const filters: Filters = {
    status: (params.get("status") as Filters["status"]) ?? "all",
    q: params.get("q") ?? "",
    priority: (params.get("prio") as Filters["priority"]) ?? "all",
    boardId: params.get("board") ?? "all",
  };
  const sort = (params.get("sort") as SortKey) ?? "deadline";
  const set = (key: string, value: string, fallback: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === fallback || !value) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  return {
    filters,
    sort,
    setStatus: (v: string) => set("status", v, "all"),
    setQ: (v: string) => set("q", v, ""),
    setPriority: (v: string) => set("prio", v, "all"),
    setBoard: (v: string) => set("board", v, "all"),
    setSort: (v: string) => set("sort", v, "deadline"),
    clear: () =>
      setParams(
        (prev) => {
          const next = new URLSearchParams();
          if (prev.get("status")) next.set("status", prev.get("status")!);
          if (prev.get("sort")) next.set("sort", prev.get("sort")!);
          return next;
        },
        { replace: true },
      ),
  };
}

/** Tab kiểu bìa hồ sơ: tab đang mở nối liền với ngăn bên dưới. */
function FolderTabs({
  value,
  counts,
  onChange,
}: {
  value: Filters["status"];
  counts: Record<Filters["status"], number>;
  onChange: (v: Filters["status"]) => void;
}) {
  const tabs: { key: Filters["status"]; label: string }[] = [
    { key: "all", label: "Tất cả" },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_LABEL[s] })),
  ];
  return (
    <div role="tablist" aria-label="Lọc theo trạng thái" className="-mb-px flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "group relative flex h-10 shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "z-10 border-border bg-card text-foreground"
                : "border-transparent text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            {t.key !== "all" && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 top-0 h-[3px] rounded-b-sm transition-opacity",
                  STATUS_DOT[t.key],
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-50",
                )}
              />
            )}
            {t.label}
            <span
              className={cn(
                "min-w-6 rounded-full px-1.5 text-center text-xs tabular leading-5",
                active ? "bg-muted text-foreground" : "bg-transparent",
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SelectPill<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent"
        >
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-medium">{current?.label}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => onChange(o.value)} className={cn(o.value === value && "font-semibold")}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusMenu({ task, onChange }: { task: Task; onChange: (s: Status) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Trạng thái: ${STATUS_LABEL[task.status]}. Bấm để đổi`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex h-7 w-[5.5rem] shrink-0 items-center justify-between gap-1 rounded-full pr-1.5 pl-2.5 text-xs font-semibold outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-110",
            STATUS_SOFT[task.status],
            STATUS_TEXT[task.status],
          )}
        >
          {STATUS_LABEL[task.status]}
          <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Chuyển sang</DropdownMenuLabel>
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} disabled={s === task.status} onSelect={() => onChange(s)}>
            <span className={cn("size-2 rounded-full", STATUS_DOT[s])} aria-hidden="true" />
            {STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PriorityTag({ priority }: { priority: Priority | null }) {
  if (!priority) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        aria-hidden="true"
        className={cn("inline-block size-2.5 rounded-[3px]", PRIORITY_DOT[priority], priority === "low" && "opacity-70")}
      />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

function TaskRow({
  task,
  flash,
  onOpen,
  onStatus,
  onDelete,
}: {
  task: Task;
  flash: boolean;
  onOpen: () => void;
  onStatus: (s: Status) => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task);
  const done = task.status === "done";
  return (
    <li
      className={cn(
        "task-row group grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-5 lg:grid-cols-[auto_minmax(0,1fr)_9rem_6rem_10.5rem_auto] lg:items-center",
        flash && "task-row-flash",
      )}
      onClick={onOpen}
    >
      <div className="pt-0.5 lg:pt-0">
        <StatusMenu task={task} onChange={onStatus} />
      </div>

      <div className="min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={cn(
            "line-clamp-2 max-w-full text-left text-[15px] font-medium outline-none hover:underline focus-visible:underline lg:line-clamp-1",
            done && "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {task.name}
        </button>
        {task.description && (
          <p className="line-clamp-1 text-sm text-muted-foreground">{task.description}</p>
        )}
        {/* Thông tin phụ trên màn hẹp */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground lg:hidden">
          <PriorityTag priority={task.priority} />
          {task.dueAt && (
            <span className={cn("tabular", overdue && "font-medium text-overdue")}>{dueText(task.dueAt)}</span>
          )}
          <span>{task.boardName}</span>
        </div>
      </div>

      <span className="hidden truncate text-sm text-muted-foreground lg:block" title={task.boardName}>
        {task.boardName}
      </span>
      <span className="hidden lg:block">
        <PriorityTag priority={task.priority} />
      </span>
      <span className="hidden lg:block">
        {task.dueAt ? (
          <span className={cn("block text-sm tabular", overdue ? "font-medium text-overdue" : done ? "text-muted-foreground" : "")}>
            {dueText(task.dueAt)}
            {overdue && (
              <span className="block text-xs font-normal">
                Trễ {formatDistanceToNowStrict(new Date(task.dueAt), { locale: vi })}
              </span>
            )}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Không có hạn</span>
        )}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Thao tác với task ${task.name}`}
            onClick={(e) => e.stopPropagation()}
            className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 lg:data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={onOpen}>Sửa</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/board/${task.boardId}`}>Mở trên board</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            Xoá
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function SkeletonRows() {
  return (
    <ul aria-hidden="true" className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <span className="h-7 w-[5.5rem] animate-pulse rounded-full bg-muted" />
          <span className="h-4 flex-1 animate-pulse rounded bg-muted" style={{ maxWidth: `${60 - i * 7}%` }} />
          <span className="hidden h-4 w-24 animate-pulse rounded bg-muted md:block" />
        </li>
      ))}
    </ul>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const tasksQuery = useTasks();
  const boardsQuery = useBoardsSummary();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { filters, sort, setStatus, setQ, setPriority, setBoard, setSort, clear } = useFilters();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [query, setQuery] = useState(filters.q);

  useEffect(() => {
    const t = setTimeout(() => setQ(query), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!flashId) return;
    const t = setTimeout(() => setFlashId(null), 2400);
    return () => clearTimeout(t);
  }, [flashId]);

  // Phím tắt: N để thêm task, / để tìm.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setEditing(null);
        setFormOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("task-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tasks = tasksQuery.data ?? [];
  const boards = boardsQuery.data ?? [];

  const counts = useMemo(() => {
    const base = { ...filters, status: "all" as const };
    const visible = tasks.filter((t) => matches(t, base));
    return {
      all: visible.length,
      todo: visible.filter((t) => t.status === "todo").length,
      doing: visible.filter((t) => t.status === "doing").length,
      done: visible.filter((t) => t.status === "done").length,
    };
  }, [tasks, filters]);

  const visible = useMemo(() => tasks.filter((t) => matches(t, filters)).sort(compare(sort)), [tasks, filters, sort]);
  const groups = sort === "deadline" ? groupTasks(visible) : [{ key: null, tasks: visible }];
  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const openCount = tasks.filter((t) => t.status !== "done").length;
  const hasFilters = !!filters.q || filters.priority !== "all" || filters.boardId !== "all";

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  async function changeStatus(task: Task, status: Status) {
    try {
      await updateTask.mutateAsync({ task, input: { status } });
      setFlashId(task.id);
      toast.success(`Đã chuyển "${task.name}" sang ${STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không đổi được trạng thái");
    }
  }

  async function save(input: TaskInput) {
    if (editing) {
      await updateTask.mutateAsync({ task: editing, input });
      setFlashId(editing.id);
      toast.success("Đã lưu thay đổi");
    } else {
      const created = await createTask.mutateAsync(input);
      setFlashId(created.id);
      toast.success("Đã thêm task", { description: input.name });
    }
  }

  async function confirmDelete() {
    const task = toDelete;
    if (!task) return;
    setToDelete(null);
    setFormOpen(false);
    try {
      await deleteTask.mutateAsync(task);
      toast("Đã xoá task", {
        description: task.name,
        action: {
          label: "Hoàn tác",
          onClick: () =>
            createTask.mutate({
              name: task.name,
              description: task.description ?? "",
              dueAt: task.dueAt,
              priority: task.priority ?? "medium",
              status: task.status,
              boardId: task.boardId,
            }),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xoá được task");
    }
  }

  const today = format(new Date(), "EEEE, 'ngày' d 'tháng' M", { locale: vi });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground"><span className="inline-block first-letter:uppercase">{today}</span>{user?.name ? ` · Chào ${user.name}` : ""}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Việc của tôi
          </h1>
          {tasksQuery.isSuccess && (
            <p className="mt-1 text-sm text-muted-foreground">
              {openCount === 0 ? "Không còn việc nào đang chờ." : `${openCount} việc chưa xong`}
              {overdueCount > 0 && (
                <>
                  {" · "}
                  <button
                    type="button"
                    className="font-medium text-overdue underline-offset-2 hover:underline"
                    onClick={() => {
                      setSort("deadline");
                      setStatus("all");
                    }}
                  >
                    {overdueCount} việc quá hạn
                  </button>
                </>
              )}
            </p>
          )}
        </div>
        <Button onClick={openNew} size="lg" className="h-10 gap-2 px-4">
          <Plus className="size-4" aria-hidden="true" />
          Thêm task
          <kbd className="ml-1 hidden rounded border border-primary-foreground/30 px-1.5 text-[11px] font-medium opacity-80 sm:inline">
            N
          </kbd>
        </Button>
      </header>

      <section className="mt-6" aria-label="Danh sách task">
        <FolderTabs value={filters.status} counts={counts} onChange={(v) => setStatus(v)} />

        <div className="overflow-hidden rounded-b-xl rounded-tr-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(15_23_42/0.12)]">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-3 sm:px-5">
            <div className="relative min-w-0 flex-1 basis-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="task-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tiêu đề hoặc mô tả"
                aria-label="Tìm task"
                className="h-9 w-full rounded-md border border-input bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Xoá từ khoá"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border px-1.5 text-[11px] text-muted-foreground sm:block">
                  /
                </kbd>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <SelectPill
                label="Ưu tiên"
                value={filters.priority}
                onChange={setPriority}
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "high", label: "Cao" },
                  { value: "medium", label: "Vừa" },
                  { value: "low", label: "Thấp" },
                ]}
              />
              {boards.length > 1 && (
                <SelectPill
                  label="Board"
                  value={filters.boardId}
                  onChange={setBoard}
                  options={[{ value: "all", label: "Tất cả" }, ...boards.map((b) => ({ value: b.id, label: b.name }))]}
                />
              )}
              <SelectPill
                label="Sắp xếp"
                value={sort}
                onChange={setSort}
                options={(Object.keys(SORT_LABEL) as SortKey[]).map((k) => ({ value: k, label: SORT_LABEL[k] }))}
              />
              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-9" onClick={() => { setQuery(""); clear(); }}>
                  Xoá bộ lọc
                </Button>
              )}
            </div>
          </div>

          <div className="hidden grid-cols-[5.5rem_minmax(0,1fr)_9rem_6rem_10.5rem_2rem] gap-x-3 border-b px-5 py-2 text-xs font-medium text-muted-foreground lg:grid">
            <span>Trạng thái</span>
            <span>Task</span>
            <span>Board</span>
            <span>Ưu tiên</span>
            <span>Hạn chót</span>
            <span />
          </div>

          {tasksQuery.isPending ? (
            <SkeletonRows />
          ) : tasksQuery.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
              <div>
                <p className="font-medium">Không tải được danh sách task</p>
                <p className="mt-1 text-sm text-muted-foreground">{tasksQuery.error.message}</p>
              </div>
              <Button variant="outline" onClick={() => tasksQuery.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <CalendarClock className="size-8 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium">Chưa có task nào</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Thêm việc đầu tiên, đặt hạn chót và mức ưu tiên để biết nên làm gì trước.
                </p>
              </div>
              <Button onClick={openNew} className="gap-2">
                <Plus className="size-4" aria-hidden="true" />
                Thêm task đầu tiên
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium">
                  {filters.status !== "all" && !hasFilters
                    ? `Không có task nào ở trạng thái ${STATUS_LABEL[filters.status]}`
                    : "Không có task nào khớp bộ lọc"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filters.q ? `Không tìm thấy "${filters.q}".` : "Thử bỏ bớt điều kiện lọc."}
                </p>
              </div>
              <div className="flex gap-2">
                {hasFilters && (
                  <Button variant="outline" onClick={() => { setQuery(""); clear(); }}>
                    Xoá bộ lọc
                  </Button>
                )}
                {filters.status !== "all" && (
                  <Button variant="outline" onClick={() => setStatus("all")}>
                    Xem tất cả
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {groups.map((g) => (
                <div key={g.key ?? "all"}>
                  {g.key && (
                    <h2
                      className={cn(
                        "sticky top-0 z-[1] flex items-center gap-2 border-b bg-card/95 px-4 py-2 text-xs font-semibold backdrop-blur sm:px-5",
                        g.key === "overdue" ? "text-overdue" : "text-muted-foreground",
                      )}
                    >
                      {GROUP_LABEL[g.key]}
                      <span className="font-normal tabular">{g.tasks.length}</span>
                    </h2>
                  )}
                  <ul className="divide-y border-b last:border-b-0">
                    {g.tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        flash={flashId === task.id}
                        onOpen={() => {
                          setEditing(task);
                          setFormOpen(true);
                        }}
                        onStatus={(s) => changeStatus(task, s)}
                        onDelete={() => setToDelete(task)}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        {tasksQuery.isSuccess && visible.length > 0 && (
          <p className="mt-3 px-1 text-xs text-muted-foreground">
            Hiển thị {visible.length}/{tasks.length} task · Bấm vào một dòng để sửa · Phím tắt: <kbd className="font-sans">N</kbd> thêm
            task, <kbd className="font-sans">/</kbd> tìm kiếm
          </p>
        )}
      </section>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        boards={boards}
        defaultStatus={filters.status === "all" ? "todo" : filters.status}
        defaultBoardId={filters.boardId === "all" ? undefined : filters.boardId}
        saving={createTask.isPending || updateTask.isPending}
        onSubmit={save}
        onDelete={editing ? () => setToDelete(editing) : undefined}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá task này?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" sẽ bị xoá cùng checklist và bình luận của nó. Bạn có thể hoàn tác ngay sau khi xoá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Xoá task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
