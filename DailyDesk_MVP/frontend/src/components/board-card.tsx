import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { Link } from "react-router";
import { STATUS_TEXT, statusFromList } from "@/features/tasks/api";
import { cn } from "@/lib/utils";

type CardLike = { id?: string; name?: string; title?: string; dueAt?: string | null };
type ListLike = { name: string; cards?: CardLike[] };

/** Những việc gần hạn nhất còn chưa xong — thứ người ta mở board để xem. */
export function nextDue(lists: ListLike[], take = 5) {
  return lists
    .filter((l) => statusFromList(l.name) !== "done")
    .flatMap((l) => l.cards ?? [])
    .filter((c): c is CardLike & { dueAt: string } => !!c?.dueAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, take);
}

const DAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
/** Cùng cách viết ngày với màn "Việc của tôi": "T3, 3/11". */
function shortDate(iso: string) {
  const d = new Date(iso);
  return `${DAY_SHORT[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

export interface BoardCardProps {
  id: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  lists?: ListLike[];
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  /** Số dòng việc mọi card trong cùng hàng cùng hiện, để chúng kết thúc bằng nhau. */
  upcomingRows?: number;
}

/** Board là một bìa hồ sơ: tab màu ở mép trên, nhãn mực, số task theo trạng thái. */
export function BoardCard({
  id,
  name: title,
  backgroundUrl,
  backgroundColor,
  lists = [],
  onEdit,
  onDelete,
  compact = false,
  upcomingRows = 5,
}: BoardCardProps) {
  const counts = { todo: 0, doing: 0, done: 0 };
  lists.forEach((l) => {
    counts[statusFromList(l.name)] += l.cards?.length ?? 0;
  });
  const total = counts.todo + counts.doing + counts.done;
  const upcoming = compact ? [] : nextDue(lists, upcomingRows);

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link
      to={`/board/${id}`}
      className="group flex h-full flex-col rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Mép bìa sổ mang màu của board: màu này là danh tính, nên mảnh và trầm. */}
      <span
        aria-hidden="true"
        className="block h-1.5 rounded-t-md"
        style={
          backgroundUrl
            ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: backgroundColor || "var(--primary)" }
        }
      />
      <div
        className={cn(
          // Hover đổi viền, không nhấc card lên: bóng để dành cho thứ thật sự nổi.
          "relative flex flex-1 flex-col rounded-b-md border border-t-0 bg-card px-4 py-3.5 transition-colors group-hover:border-ring/60 group-hover:bg-accent/40",
          compact ? "min-h-20" : "min-h-40",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Literata chỉ dành cho H1 của màn và tiêu đề nhóm ngày. */}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">{title}</h3>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={stop}>
                <button
                  type="button"
                  aria-label={`Thao tác với board ${title}`}
                  className="-mt-1 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={stop}>
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { stop(e); onEdit(); }}>
                    <Pencil className="size-4" />
                    Sửa
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem variant="destructive" onClick={(e) => { stop(e); onDelete(); }}>
                    <Trash2 className="size-4" />
                    Xoá
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {!compact && (
          <>
            {/* Thứ người ta mở board để xem, ngay dưới tên board. */}
            {upcoming.length === 0 ? (
              <p className="mt-2.5 text-[13px] text-muted-foreground">
                {total === 0 ? "Chưa có task" : "Chưa có việc nào có hạn"}
              </p>
            ) : (
              <ul className="mt-2.5 space-y-1.5">
                {upcoming.map((c, i) => {
                  const late = new Date(c.dueAt).getTime() < Date.now();
                  return (
                    <li key={c.id ?? i} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="min-w-0 truncate">{c.name ?? c.title}</span>
                      <span className={cn("shrink-0 tabular", late ? "font-medium text-overdue" : "text-muted-foreground")}>
                        {shortDate(c.dueAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Tổng số neo xuống đáy card. Card nào ít việc hơn thì khoảng dôi
                ra nằm TRÊN dòng này chứ không thành một lỗ hổng ở cuối — mọi
                card trong hàng vẫn kết thúc trên cùng một mép.
                Chấm màu trước mỗi con số là bộ màu thứ ba trên màn; con số tự
                nói đủ rồi. */}
            <p className="mt-auto border-t pt-2.5 text-[13px] text-muted-foreground tabular">
              {total === 0
                ? "Board trống"
                : `${counts.todo} ${STATUS_TEXT.todo} · ${counts.doing} ${STATUS_TEXT.doing} · ${counts.done} ${STATUS_TEXT.done}`}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}
