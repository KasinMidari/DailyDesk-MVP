import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAtomValue } from "jotai";
import type { CSSProperties, MouseEvent } from "react";
import { Link } from "react-router";
import { STATUS_TEXT, statusFromList } from "@/features/tasks/api";
import { boardCardStyleAtom } from "@/stores/preferences";
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

/** Nền của board: ảnh nếu có, không thì màu. Dùng cho cả hai kiểu card. */
function backgroundStyle(backgroundUrl?: string, backgroundColor?: string): CSSProperties {
  if (backgroundUrl) return { backgroundImage: `url(${backgroundUrl})` };
  return { backgroundColor: backgroundColor || "var(--primary)" };
}

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
  const style = useAtomValue(boardCardStyleAtom);
  const counts = { todo: 0, doing: 0, done: 0 };
  lists.forEach((l) => {
    counts[statusFromList(l.name)] += l.cards?.length ?? 0;
  });
  const total = counts.todo + counts.doing + counts.done;

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const menu = (onEdit || onDelete) && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stop}>
        <button
          type="button"
          aria-label={`Thao tác với board ${title}`}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
            style === "cover"
              ? "text-white/90 hover:bg-white/20 hover:text-white"
              : "-mt-1 -mr-1.5 text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={stop}>
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              stop(e);
              onEdit();
            }}
          >
            <Pencil className="size-4" />
            Sửa
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              stop(e);
              onDelete();
            }}
          >
            <Trash2 className="size-4" />
            Xoá
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const counted =
    total === 0
      ? "Chưa có task"
      : `${counts.todo} ${STATUS_TEXT.todo} · ${counts.doing} ${STATUS_TEXT.doing} · ${counts.done} ${STATUS_TEXT.done}`;

  const linkClass =
    "group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  // KIỂU "COVER": ảnh/màu phủ kín, chữ đè lên trên một lớp tối cho đọc được.
  if (style === "cover") {
    return (
      <Link to={`/board/${id}`} className={linkClass}>
        <div
          className={cn(
            "relative flex flex-col justify-end overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat transition-shadow group-hover:shadow-md",
            compact ? "min-h-20" : "min-h-36",
          )}
          style={backgroundStyle(backgroundUrl, backgroundColor)}
        >
          {/* Lớp tối: ảnh sáng hay tối thì chữ trắng vẫn đọc được. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 transition-colors group-hover:from-black/75"
          />
          <div className="relative flex items-start justify-between gap-2 p-4">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-white drop-shadow-sm">
                {title}
              </h3>
              {!compact && (
                <p className="mt-1 text-[13px] text-white/85 tabular drop-shadow-sm">{counted}</p>
              )}
            </div>
            {menu}
          </div>
        </div>
      </Link>
    );
  }

  // KIỂU "BAND": một dải ảnh/màu trên cùng, thân card là giấy.
  return (
    <Link to={`/board/${id}`} className={linkClass}>
      <span
        aria-hidden="true"
        className={cn(
          "block rounded-t-xl bg-cover bg-center bg-no-repeat",
          compact ? "h-12" : "h-20",
        )}
        style={backgroundStyle(backgroundUrl, backgroundColor)}
      />
      <div
        className={cn(
          "relative flex flex-col justify-between rounded-b-xl border border-t-0 bg-card px-4 py-3.5 transition-[border-color,box-shadow] group-hover:border-ring/60 group-hover:shadow-[0_6px_18px_-10px_rgb(15_23_42/0.25)]",
          compact ? "min-h-20" : "min-h-28",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">{title}</h3>
          {menu}
        </div>
        {!compact && (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground tabular">
            {total === 0 ? (
              "Chưa có task"
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-gray-400" aria-hidden="true" />
                  {counts.todo} {STATUS_TEXT.todo}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                  {counts.doing} {STATUS_TEXT.doing}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  {counts.done} {STATUS_TEXT.done}
                </span>
              </>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
