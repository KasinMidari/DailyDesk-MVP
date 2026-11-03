import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { Link } from "react-router";
import { statusFromList } from "@/features/tasks/api";
import { cn } from "@/lib/utils";

type ListLike = { name: string; cards?: unknown[] };

export interface BoardCardProps {
  id: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
  lists?: ListLike[];
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
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
}: BoardCardProps) {
  const counts = { todo: 0, doing: 0, done: 0 };
  lists.forEach((l) => {
    counts[statusFromList(l.name)] += l.cards?.length ?? 0;
  });
  const total = counts.todo + counts.doing + counts.done;

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link
      to={`/board/${id}`}
      className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Mép bìa sổ mang màu của board */}
      <span
        aria-hidden="true"
        className="block h-2 rounded-t-md"
        style={
          backgroundUrl
            ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: backgroundColor || "var(--primary)" }
        }
      />
      <div
        className={cn(
          "relative flex flex-col justify-between rounded-b-md border border-t-0 bg-card px-4 py-3.5 transition-[border-color,box-shadow] group-hover:border-ring/50 group-hover:shadow-[0_10px_22px_-14px_oklch(0.3_0.05_80/0.45)]",
          compact ? "min-h-20" : "min-h-28",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-planner line-clamp-2 text-base font-semibold leading-snug">{title}</h3>
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
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground tabular">
            {total === 0 ? (
              "Chưa có task"
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-todo" aria-hidden="true" />{counts.todo} Todo</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-doing" aria-hidden="true" />{counts.doing} Doing</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-status-done" aria-hidden="true" />{counts.done} Done</span>
              </>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
