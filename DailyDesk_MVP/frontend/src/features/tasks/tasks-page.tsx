import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { formatDue, formatWeekdayDate } from "@/lib/date";
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
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABEL,
  STATUS_TEXT,
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
import TaskFormDialog from "./task-form-dialog";

const SORT_LABEL: Record<SortKey, string> = {
  deadline: "Hạn gần nhất",
  "deadline-desc": "Hạn xa nhất",
  priority: "Ưu tiên cao trước",
  newest: "Mới tạo",
};

const dueText = (iso: string) => formatDue(iso);

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

function Tick() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Tab chữ của trang sổ, đếm số việc ở mỗi trạng thái. */
function PlannerTabs({
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
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_TEXT[s] })),
  ];
  return (
    <div role="tablist" aria-label="Lọc theo trạng thái" className="flex gap-1 overflow-x-auto border-b sm:gap-4">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className="planner-tab flex h-10 shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:px-1"
          >
            {t.label}
            <span className={cn("text-xs tabular", active ? "text-ink" : "text-muted-foreground")}>{counts[t.key]}</span>
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
          <span className="text-muted-foreground">{label}</span>
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

/** Ô trạng thái nằm ở lề: bấm để đánh dấu xong (hoặc mở lại nếu đã xong). */
function StatusBox({ task, onChange }: { task: Task; onChange: (s: Status) => void }) {
  const done = task.status === "done";
  return (
    <button
      type="button"
      aria-label={done ? `Mở lại "${task.name}"` : `Đánh dấu "${task.name}" là ${STATUS_TEXT.done}`}
      title={done ? "Mở lại" : "Đánh dấu xong"}
      onClick={(e) => {
        e.stopPropagation();
        onChange(done ? "todo" : "done");
      }}
      className="-m-2 grid place-items-center rounded-md p-2 outline-none hover:[&>span]:border-ink focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="status-box" data-status={task.status}>
        {done && <Tick />}
      </span>
    </button>
  );
}

const STATUS_INK: Record<Status, string> = {
  todo: "text-muted-foreground",
  doing: "text-status-doing",
  // Done là trạng thái yên nhất: than chì nhạt, không phải màu mực.
  done: "text-status-done",
};

function StatusMenu({ task, onChange }: { task: Task; onChange: (s: Status) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Trạng thái: ${STATUS_TEXT[task.status]}. Bấm để đổi`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "-mx-1.5 inline-flex h-8 items-center gap-0.5 rounded-md px-1.5 text-[13px] font-semibold outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent",
            STATUS_INK[task.status],
          )}
        >
          {STATUS_TEXT[task.status]}
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Chuyển sang</DropdownMenuLabel>
        {STATUS_ORDER.map((s) => (
          <DropdownMenuItem key={s} disabled={s === task.status} onSelect={() => onChange(s)}>
            <span className="status-box scale-75" data-status={s} aria-hidden="true">
              {s === "done" && <Tick />}
            </span>
            {STATUS_TEXT[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* Chỉ "Cao" được tô dạ quang. "Vừa" là chữ thường, "Thấp" là chữ mờ: nếu mọi
   mức đều có màu thì không mức nào còn nổi lên. */
function PriorityTag({ priority }: { priority: Priority | null }) {
  if (!priority) return <span className="text-sm text-muted-foreground">—</span>;
  if (priority === "low") return <span className="text-sm text-muted-foreground">{PRIORITY_LABEL.low}</span>;
  if (priority === "medium") return <span className="text-sm">{PRIORITY_LABEL.medium}</span>;
  return (
    <span className="text-sm">
      <span className="hl hl-high font-medium">{PRIORITY_LABEL.high}</span>
    </span>
  );
}

const ROW_COLS_BOARD = "lg:grid-cols-[1.25rem_minmax(0,1fr)_6rem_8.5rem_5rem_9.5rem_2rem]";
const ROW_COLS = "lg:grid-cols-[1.25rem_minmax(0,1fr)_6rem_5rem_9.5rem_2rem]";

function TaskRow({
  task,
  flash,
  onOpen,
  onStatus,
  onDelete,
  showBoard,
}: {
  task: Task;
  flash: boolean;
  onOpen: () => void;
  onStatus: (s: Status) => void;
  onDelete: () => void;
  /** Chỉ hiện tên board khi người dùng có nhiều hơn một board. */
  showBoard: boolean;
}) {
  const overdue = isOverdue(task);
  const done = task.status === "done";
  return (
    <li
      className={cn(
        "task-row group grid cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-3 transition-colors hover:bg-accent/45 sm:px-5 lg:items-center lg:py-2.5",
        showBoard ? ROW_COLS_BOARD : ROW_COLS,
        flash && "task-row-flash",
      )}
      onClick={onOpen}
    >
      <div className="pt-0.5 lg:pt-0">
        <StatusBox task={task} onChange={onStatus} />
      </div>

      {/* Cột tiêu đề bắt đầu đúng tại đường lề đỏ + một gutter, như tiêu đề nhóm ngày. */}
      <div className="min-w-0 pl-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={cn(
              "line-clamp-2 min-w-0 text-left text-[15px] font-medium outline-none hover:underline focus-visible:underline lg:line-clamp-1",
              done && "text-muted-foreground line-through decoration-muted-foreground/60",
            )}
          >
            {task.name}
          </button>
          {/* Con dấu chỉ đóng một lần, lúc vừa tick; dòng Done lúc nghỉ chỉ còn ô tick + gạch ngang. */}
          {done && flash && <span className="stamp stamp-press shrink-0">XONG</span>}
        </div>
        {task.description && <p className="line-clamp-1 text-sm text-muted-foreground">{task.description}</p>}
        {/* Thông tin phụ trên màn hẹp */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground lg:hidden">
          <StatusMenu task={task} onChange={onStatus} />
          <PriorityTag priority={task.priority} />
          {task.dueAt && (
            <span className={cn("tabular", overdue && "font-medium text-overdue")}>{dueText(task.dueAt)}</span>
          )}
          {showBoard && <span>{task.boardName}</span>}
        </div>
      </div>

      <span className="hidden lg:block">
        <StatusMenu task={task} onChange={onStatus} />
      </span>
      {showBoard && (
        <span className="hidden truncate text-sm text-muted-foreground lg:block" title={task.boardName}>
          {task.boardName}
        </span>
      )}
      <span className="hidden lg:block">
        <PriorityTag priority={task.priority} />
      </span>
      {/* Ngày là thứ người dùng so dọc theo cột: một mép phải chung, chữ số tabular.
          Một dấu đỏ cho mỗi dòng: chính cái ngày. Dòng "Trễ …" bên dưới là chữ mờ,
          nếu nó cũng đỏ thì đỏ thành nền chứ không còn là tín hiệu. */}
      <span className="hidden text-right lg:block">
        {task.dueAt ? (
          <span className={cn("block text-sm tabular", overdue ? "font-medium text-overdue" : done ? "text-muted-foreground" : "")}>
            {dueText(task.dueAt)}
            {overdue && (
              <span className="block text-xs font-normal text-muted-foreground">
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

/** Khung chờ: đúng lưới, pitch và số cột của TaskRow, mỗi giá trị là một thanh xám ở cỡ thật. */
function SkeletonRows({ showBoard }: { showBoard: boolean }) {
  return (
    <ul aria-hidden="true" className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-3 sm:px-5 lg:items-center lg:py-2.5",
            showBoard ? ROW_COLS_BOARD : ROW_COLS,
          )}
        >
          <span className="size-5 rounded bg-muted" />
          <div className="min-w-0 pl-3">
            <span className="block h-[15px] rounded bg-muted" style={{ width: `${70 - i * 8}%` }} />
            {/* Hàng thông tin phụ của màn hẹp cũng chiếm chỗ, để lưới không nhảy khi data về. */}
            <span className="mt-1.5 block h-8 w-44 max-w-full rounded bg-muted lg:hidden" />
          </div>
          <span className="hidden h-[13px] w-14 rounded bg-muted lg:block" />
          {showBoard && <span className="hidden h-[14px] w-20 rounded bg-muted lg:block" />}
          <span className="hidden h-[14px] w-10 rounded bg-muted lg:block" />
          <span className="hidden h-[14px] w-24 justify-self-end rounded bg-muted lg:block" />
          <span />
        </li>
      ))}
    </ul>
  );
}

function EmptyNote({ icon: Icon, title, body, children }: { icon: typeof CalendarClock; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 py-14 pr-6 pl-16 sm:pl-20">
      <Icon className="size-7 text-ink" aria-hidden="true" />
      <div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export default function TasksPage() {
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
  const showBoard = boards.length > 1;
  const hasFilters = !!filters.q || filters.priority !== "all" || filters.boardId !== "all";

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  async function changeStatus(task: Task, status: Status) {
    try {
      await updateTask.mutateAsync({ task, input: { status } });
      setFlashId(task.id);
      toast.success(`Đã chuyển "${task.name}" sang ${STATUS_TEXT[status]}`);
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


  const today = formatWeekdayDate(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 lg:px-10">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="font-planner mt-1 text-[1.75rem] leading-tight font-semibold">Việc của tôi</h1>
        </div>
        <Button onClick={openNew} size="lg" className="h-10 shrink-0 gap-2 px-3.5 sm:px-4">
          <Plus className="size-4" aria-hidden="true" />
          Thêm task
          {/* Phím tắt hiện ngay trên nút, không nằm trong tooltip. */}
          <kbd
            aria-hidden="true"
            className="ml-0.5 hidden rounded bg-primary-foreground/20 px-1.5 py-px text-[11px] font-semibold sm:inline-block"
          >
            N
          </kbd>
        </Button>
      </header>
      {/* Câu số liệu đứng riêng một dòng dưới cả hàng header: ở màn hẹp tiêu
          đề và nút đã chiếm hết hàng trên, nên để chung cột với tiêu đề thì nó
          bị nút đè lên hoặc phải cắt ngang giữa một cụm từ.
          Mỗi vế là một cụm không tách, dấu "·" đi liền vế sau. */}
      {tasksQuery.isSuccess && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">
            {openCount === 0 ? "Không còn việc nào đang chờ." : `${openCount} việc chưa xong`}
          </span>
          {overdueCount > 0 && (
            <span className="whitespace-nowrap">
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
            </span>
          )}
        </p>
      )}

      <section className="mt-6" aria-label="Danh sách task">
        <PlannerTabs value={filters.status} counts={counts} onChange={(v) => setStatus(v)} />

        <div className="flex flex-wrap items-center gap-2 py-3">
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="task-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mô tả"
              aria-label="Tìm task"
              className="h-9 w-full rounded-md border border-input bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 [&::-webkit-search-cancel-button]:hidden"
            />
            {!query && (
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground sm:block"
              >
                /
              </kbd>
            )}
            {query && (
              <button
                type="button"
                aria-label="Xoá từ khoá"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
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

        {/* Trang sổ tách khỏi giấy bằng một bậc nền và một đường viền 1px —
            viền HOẶC bóng, không bao giờ cả hai, và chỉ thứ thật sự nổi lên
            (menu, hộp thoại) mới được đổ bóng. */}
        <div className="planner-page overflow-hidden rounded-md border">
          <div
            className={cn(
              "hidden gap-x-3 border-b px-5 py-2 text-xs text-muted-foreground lg:grid",
              showBoard ? ROW_COLS_BOARD : ROW_COLS,
            )}
          >
            <span />
            {/* pl-3 cho khớp mép chữ của hàng task, để nhãn cột không lệch khỏi tiêu đề ở sm. */}
            <span className="pl-3">Việc</span>
            <span>Trạng thái</span>
            {showBoard && <span>Board</span>}
            <span>Ưu tiên</span>
            <span className="text-right">Hạn chót</span>
            <span />
          </div>

          {tasksQuery.isPending ? (
            <SkeletonRows showBoard={showBoard} />
          ) : tasksQuery.isError ? (
            <div role="alert">
              <EmptyNote icon={CircleAlert} title="Không tải được danh sách task" body={tasksQuery.error.message}>
                <Button variant="outline" onClick={() => tasksQuery.refetch()}>
                  Thử lại
                </Button>
              </EmptyNote>
            </div>
          ) : tasks.length === 0 ? (
            <EmptyNote
              icon={CalendarClock}
              title="Trang sổ còn trống"
              body="Ghi việc đầu tiên, đặt hạn chót và mức ưu tiên để biết nên làm gì trước."
            >
              <Button onClick={openNew} className="gap-2">
                <Plus className="size-4" aria-hidden="true" />
                Thêm task đầu tiên
              </Button>
            </EmptyNote>
          ) : visible.length === 0 ? (
            <EmptyNote
              icon={SearchX}
              title={
                filters.status !== "all" && !hasFilters
                  ? `Không có task nào ở trạng thái ${STATUS_TEXT[filters.status]}`
                  : "Không có task nào khớp bộ lọc"
              }
              body={filters.q ? `Không tìm thấy "${filters.q}".` : "Thử bỏ bớt điều kiện lọc."}
            >
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
            </EmptyNote>
          ) : (
            <div>
              {groups.map((g) => (
                <div key={g.key ?? "all"}>
                  {g.key && (
                    <h2
                      className={cn(
                        "font-planner sticky top-0 z-[3] flex items-baseline gap-2 border-b bg-card pt-4 pr-5 pb-1.5 pl-[calc(var(--planner-margin)+0.75rem)] text-[15px] font-semibold",
                        g.key === "overdue" ? "text-overdue" : "text-foreground",
                      )}
                    >
                      {GROUP_LABEL[g.key]}
                      <span className="font-sans text-xs font-normal text-muted-foreground tabular">{g.tasks.length}</span>
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
                        showBoard={showBoard}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
        {tasksQuery.isSuccess && visible.length > 0 && (
          <p className="mt-3 px-1 text-xs text-muted-foreground tabular">
            Hiển thị {visible.length}/{tasks.length} task
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
