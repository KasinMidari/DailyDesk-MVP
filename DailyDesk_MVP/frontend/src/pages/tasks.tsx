/**
 * Trang Lịch: task có hạn chót của mọi board trên lịch tháng/tuần/ngày.
 * Dùng chung dữ liệu và form với màn "Việc của tôi"; mọi thao tác làm được bằng bấm,
 * kéo task sang ngày khác chỉ là cách nhanh hơn để đổi hạn.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { CalendarClock, CircleAlert, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import {
  useBoardsSummary,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  type Task,
  type TaskInput,
} from "@/features/tasks/api";
import { isOverdue } from "@/features/tasks/logic";
import TaskFormDialog from "@/features/tasks/task-form-dialog";
import { formatDue } from "@/lib/date";

/** Màu sự kiện theo trạng thái, cùng ý nghĩa với tab Todo/Doing/Done; quá hạn dùng đỏ. */
function colorOf(task: Task): CalendarEvent["color"] {
  if (task.status === "done") return "emerald";
  if (isOverdue(task)) return "rose";
  if (task.status === "doing") return "amber";
  return "sky";
}

export default function CalendarPage() {
  const tasksQuery = useTasks();
  const boardsQuery = useBoardsSummary();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [newDue, setNewDue] = useState<string | null>(null);

  const tasks = tasksQuery.data ?? [];
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const events = useMemo<CalendarEvent[]>(
    () =>
      tasks
        .filter((t) => t.dueAt)
        .map((t) => ({
          id: t.id,
          title: t.name,
          description: t.description ?? undefined,
          start: new Date(t.dueAt!),
          end: new Date(t.dueAt!),
          allDay: false,
          color: colorOf(t),
          isDone: t.status === "done",
          labels: t.labels,
          listId: t.listId,
          location: t.boardName,
        })),
    [tasks],
  );

  function openTask(event: CalendarEvent) {
    const task = byId.get(event.id);
    if (!task) return;
    setEditing(task);
    setNewDue(null);
    setFormOpen(true);
  }

  function openNew(date?: Date) {
    const due = date ? new Date(date) : null;
    if (due && due.getHours() === 0 && due.getMinutes() === 0) due.setHours(17, 0, 0, 0);
    setEditing(null);
    setNewDue(due && due > new Date() ? due.toISOString() : null);
    setFormOpen(true);
  }

  async function moveTo(event: CalendarEvent) {
    const task = byId.get(event.id);
    if (!task) return;
    const old = task.dueAt ? new Date(task.dueAt) : new Date();
    const next = new Date(event.start);
    if (event.allDay || (next.getHours() === 0 && next.getMinutes() === 0)) {
      next.setHours(old.getHours(), old.getMinutes(), 0, 0);
    }
    try {
      await updateTask.mutateAsync({ task, input: { dueAt: next.toISOString() } });
      toast.success(`Đã dời "${task.name}" sang ${formatDue(next)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không đổi được hạn chót");
    }
  }

  async function save(input: TaskInput) {
    if (editing) {
      await updateTask.mutateAsync({ task: editing, input });
      toast.success("Đã lưu thay đổi");
    } else {
      await createTask.mutateAsync(input);
      toast.success("Đã thêm task", { description: input.name });
    }
  }

  async function remove() {
    const task = editing;
    if (!task) return;
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

  const undated = tasks.filter((t) => !t.dueAt && t.status !== "done").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Lịch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bấm vào task để sửa hoặc đổi hạn, bấm vào ô ngày để thêm task.
          {undated > 0 && (
            <>
              {" "}
              <Link to="/" className="font-medium text-foreground underline-offset-4 hover:underline">
                {undated} task chưa có hạn
              </Link>{" "}
              không hiện trên lịch.
            </>
          )}
        </p>
      </header>

      {tasksQuery.isPending ? (
        <div aria-busy="true" aria-label="Đang tải lịch" className="h-[32rem] animate-pulse rounded-xl border bg-card" />
      ) : tasksQuery.isError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center">
          <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">Không tải được lịch</p>
            <p className="mt-1 text-sm text-muted-foreground">{tasksQuery.error.message}</p>
          </div>
          <Button variant="outline" onClick={() => tasksQuery.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <>
          {events.length === 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4" aria-hidden="true" />
                Chưa có task nào có hạn chót.
              </p>
              <Button size="sm" className="gap-1.5" onClick={() => openNew()}>
                <Plus className="size-4" aria-hidden="true" />
                Thêm task có hạn
              </Button>
            </div>
          )}
          <EventCalendar
            events={events}
            initialView="month"
            createLabel="Thêm task"
            onCreateClick={openNew}
            onEventSelect={(e) => {
              openTask(e);
            }}
            onEventUpdate={(e) => {
              void moveTo(e);
              return false;
            }}
          />
        </>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        boards={boardsQuery.data ?? []}
        defaultDueAt={newDue}
        saving={createTask.isPending || updateTask.isPending}
        onSubmit={save}
        onDelete={editing ? remove : undefined}
      />
    </div>
  );
}
