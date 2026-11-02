/** Trạng thái + độ ưu tiên trong hộp thoại chi tiết thẻ trên board, cùng kiểu với form task. */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  request,
  statusFromList,
  type Priority,
  type Status,
} from "./api";
import { Segmented, PRIORITY_DOT, STATUS_DOT } from "./task-form-dialog";

type ListRow = { id: string; name: string; order: number };

export default function CardMetaControls({
  boardId,
  cardId,
  listId,
  priority,
}: {
  boardId: string;
  cardId: string;
  listId: string;
  priority: Priority | null | undefined;
}) {
  const qc = useQueryClient();
  const lists = useQuery({
    queryKey: ["board-lists", boardId],
    queryFn: () => request<ListRow[]>("GET", `/boards/${boardId}/lists`),
    enabled: !!boardId,
  });
  const detail = useQuery({
    queryKey: ["card-detail", boardId, cardId],
    queryFn: () => request<{ priority?: Priority | null; listId: string }>("GET", `/boards/${boardId}/cards/${cardId}`),
    enabled: !!boardId && !!cardId,
  });
  const savedPriority = detail.data?.priority ?? priority;
  const currentList = lists.data?.find((l) => l.id === (detail.data?.listId ?? listId));
  // Giá trị hiển thị lấy thẳng từ dữ liệu đã tải; lựa chọn của người dùng chỉ đè lên tạm thời.
  const [statusPick, setStatus] = useState<Status | null>(null);
  const [prioPick, setPrio] = useState<Priority | null>(null);
  const status: Status = statusPick ?? (currentList ? statusFromList(currentList.name) : "todo");
  const prio: Priority = prioPick ?? savedPriority ?? "medium";

  async function save(body: Record<string, unknown>, message: string) {
    try {
      await request("PUT", `/boards/${boardId}/cards/${cardId}`, body);
      qc.invalidateQueries({ queryKey: ["board", boardId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["card-detail", boardId, cardId] });
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không lưu được");
    }
  }

  async function changeStatus(next: Status) {
    const sorted = [...(lists.data ?? [])].sort((a, b) => a.order - b.order);
    let target = sorted.find((l) => statusFromList(l.name) === next);
    if (!target) {
      target = await request<ListRow>("POST", `/boards/${boardId}/lists`, {
        id: crypto.randomUUID(),
        name: STATUS_LABEL[next],
        order: sorted.length,
      });
      qc.invalidateQueries({ queryKey: ["board-lists", boardId] });
    }
    setStatus(next);
    await save(
      { listId: target.id, completed: next === "done", dueComplete: next === "done" },
      `Đã chuyển sang ${STATUS_LABEL[next]}`,
    );
  }

  if (detail.isPending || lists.isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
        {["Trạng thái", "Độ ưu tiên"].map((label) => (
          <div key={label} className="grid gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Trạng thái</span>
        <Segmented
          name="Trạng thái"
          value={status}
          onChange={changeStatus}
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
          tone={(s) => STATUS_DOT[s]}
        />
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Độ ưu tiên</span>
        <Segmented
          name="Độ ưu tiên"
          value={prio}
          onChange={(p) => {
            setPrio(p);
            save({ priority: p }, `Ưu tiên: ${PRIORITY_LABEL[p]}`);
          }}
          options={(["high", "medium", "low"] as Priority[]).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
          tone={(p) => PRIORITY_DOT[p]}
        />
      </div>
    </div>
  );
}
