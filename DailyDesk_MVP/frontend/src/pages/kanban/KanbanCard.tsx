import { formatShort } from "@/lib/date";
import {
  KanbanBoardCard,
  KanbanBoardCardTitle,
  KanbanBoardColumnListItem,
  type KanbanBoardCircleColor,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, MoreHorizontal, Repeat } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Card as CardType, Label, Member, Attachment, Comment, ActivityLog, CardCoverMode, RepeatFrequency } from "@/types/card";
import { useAtom } from "jotai";
import { isCardDialogOpenAtom, selectedCardAtom } from "./atoms";
import { LayoutTemplate } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";


type NormalizedCard = CardType & {
  title: string;
  description?: string;
  color?: KanbanBoardCircleColor;
  isTemplate?: boolean;
};

interface KanbanCardProps {
  card: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    listId?: string;
    position?: number;
    order?: number;
    labels?: Label[];
    members?: Member[];
    dueDate?: Date;
    startDate?: Date | string | null;
    dueAt?: Date | string | null;
    dueComplete?: boolean;
    reminderMinutes?: number | null;
    repeatFrequency?: RepeatFrequency | null;
    repeatInterval?: number | null;
    coverUrl?: string;
    coverColor?: string;
    coverMode?: CardCoverMode;
    attachments?: Attachment[];
    comments?: Comment[];
    activities?: ActivityLog[];
    createdAt?: Date;
    updatedAt?: Date;
    color?: KanbanBoardCircleColor;
    completed?: boolean;
    isTemplate?: boolean;
  };
  columnId: string;
  boardId: string;
  otherLists: { id: string; name: string }[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Thẻ đang nằm trong danh sách Done. */
  isDone: boolean;
  onMoveTo: (listId: string) => void;
  onMoveBy: (delta: -1 | 1) => void;
  onToggleDone: () => void;
  onDropOverListItem: (
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({
  card,
  columnId,
  onDropOverListItem,
  onDelete,
  otherLists,
  canMoveUp,
  canMoveDown,
  isDone: inDoneList,
  onMoveTo,
  onMoveBy,
  onToggleDone,
}: KanbanCardProps) {
  const [, setSelectedCard] = useAtom(selectedCardAtom);
  const [, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);

  const normalizedCard: NormalizedCard = {
    id: card.id,
    title: card.title || card.name || "Untitled",
    description: card.description || "",
    listId: card.listId || columnId,
    position: card.position || card.order || 0,
    order: card.order || 0,
    labels: card.labels || [],
    members: card.members || [],
    dueDate: card.dueDate,
    startDate: card.startDate,
    dueAt: card.dueAt,
    dueComplete: card.dueComplete,
    reminderMinutes: card.reminderMinutes,
    repeatFrequency: card.repeatFrequency ?? null,
    repeatInterval: card.repeatInterval ?? null,
    coverUrl: card.coverUrl || "",
    coverColor: card.coverColor || "",
    coverMode: card.coverMode,
    attachments: card.attachments || [],
    comments: card.comments || [],
    activities: card.activities || [],
    createdAt: card.createdAt || new Date(),
    updatedAt: card.updatedAt || new Date(),
    color: card.color,
    completed: card.completed,
    isTemplate: card.isTemplate,
  };

  const openCardDialog = () => {
    setSelectedCard(normalizedCard);
    setIsCardDialogOpen(true);
  };

  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Xoá task này?",
      description: `"${normalizedCard.title}" sẽ bị xoá. Bạn có thể hoàn tác ngay sau khi xoá.`,
      confirmText: "Xoá task",
      cancelText: "Giữ lại",
      variant: "destructive"
    });
    if (confirmed) {
      onDelete(normalizedCard.id);
    }
  };

  const handleToggleComplete = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Không mở hộp thoại chi tiết
    e.preventDefault();
    onToggleDone();
  };

  const isDone = inDoneList;

  const [displayDueAt, setDisplayDueAt] = useState<Date | string | null>(
    normalizedCard.dueAt ?? null
  );
  const [isRenewing, setIsRenewing] = useState(false);
  const prevDueAtRef = useRef<Date | string | null>(normalizedCard.dueAt ?? null);
  const prevDueCompleteRef = useRef<boolean>(normalizedCard.dueComplete ?? false);

  useEffect(() => {
    const prevDueAt = prevDueAtRef.current;
    const prevDueComplete = prevDueCompleteRef.current;
    const nextDueAt = normalizedCard.dueAt ?? null;
    const nextDueComplete = normalizedCard.dueComplete ?? false;
    const hasRepeat = !!normalizedCard.repeatFrequency;

    const prevDueTime = prevDueAt ? new Date(prevDueAt).getTime() : null;
    const nextDueTime = nextDueAt ? new Date(nextDueAt).getTime() : null;
    const dueAtChanged = prevDueTime !== nextDueTime;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (hasRepeat && dueAtChanged && prevDueComplete && !nextDueComplete && prevDueAt && nextDueAt) {
      setDisplayDueAt(prevDueAt);
      setIsRenewing(true);
      timeoutId = setTimeout(() => {
        setDisplayDueAt(nextDueAt);
        setIsRenewing(false);
      }, 2000);
    } else {
      setDisplayDueAt(nextDueAt);
      setIsRenewing(false);
    }

    prevDueAtRef.current = nextDueAt;
    prevDueCompleteRef.current = nextDueComplete;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [normalizedCard.dueAt, normalizedCard.dueComplete, normalizedCard.repeatFrequency]);

  const formatShortDateVN = (value: Date | string) => formatShort(value);

  const getDateRangeLabel = () => {
    if (normalizedCard.startDate && displayDueAt) {
      return `${formatShortDateVN(normalizedCard.startDate)} – ${formatShortDateVN(displayDueAt)}`;
    }
    if (displayDueAt) {
      return formatShortDateVN(displayDueAt);
    }
    if (normalizedCard.startDate) {
      return formatShortDateVN(normalizedCard.startDate);
    }
    return "Lặp lại";
  };

  const shouldShowDateRow =
    !!normalizedCard.startDate || !!displayDueAt || !!normalizedCard.repeatFrequency;

  const priority = (card as { priority?: "high" | "medium" | "low" | null }).priority ?? null;
  const PriorityMark = ({ className = "" }: { className?: string }) =>
    priority ? (
      <span className={`inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-xs ${className}`}>
        <span
          aria-hidden="true"
          className={`inline-block size-2 rounded-[2px] ${priority === "high" ? "bg-prio-high" : priority === "medium" ? "bg-prio-medium" : "bg-prio-low"}`}
        />
        {priority === "high" ? "Cao" : priority === "medium" ? "Vừa" : "Thấp"}
      </span>
    ) : null;

  const DateRow = ({ className }: { className: string }) => (
    <div
      className={`relative flex items-center gap-1 text-xs rounded-sm px-1 py-0.5 ${className} ${
        isDone && !normalizedCard.repeatFrequency ? "bg-status-done-soft" : ""
      }`}
    >
      {isRenewing && <span className="absolute inset-0 renew-flash rounded-sm" />}
      <Clock className="relative z-10 h-3 w-3" />
      <span className="relative z-10">{getDateRangeLabel()}</span>
      {normalizedCard.repeatFrequency && (
        <Repeat className={`relative z-10 h-3 w-3 opacity-70 ${isRenewing ? "renew-spin" : ""}`} />
      )}
    </div>
  );

  return (
    <KanbanBoardColumnListItem
      key={normalizedCard.id}
      cardId={normalizedCard.id}
      onDropOverListItem={onDropOverListItem}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <KanbanBoardCard 
            data={normalizedCard} 
            onClick={openCardDialog}
            className={(normalizedCard.coverUrl || normalizedCard.coverColor) ? "!p-0 overflow-hidden relative group" : "relative group pr-9"}
          >
            {normalizedCard.coverUrl ? (
              <div className="relative w-full rounded-md hidden-cover-fix">
                {normalizedCard.isTemplate && (
                  <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-card/90 text-[10px] font-medium text-foreground">
                    <LayoutTemplate className="h-3 w-3" />
                    Mẫu
                  </div>
                )}
                <img
                  src={normalizedCard.coverUrl}
                  alt=""
                  className="w-full h-auto object-contain rounded-md"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className={`flex-shrink-0 cursor-pointer transition-opacity ${isDone ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                            role="checkbox"
                            aria-checked={isDone}
                            aria-label={isDone ? "Chuyển về Todo" : "Đánh dấu xong (chuyển sang Done)"}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") handleToggleComplete(e);
                            }}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              isDone
                                ? 'bg-status-done border-status-done flex items-center justify-center'
                                : 'border-white/70 hover:border-white'
                            }`}>
                              {isDone && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isDone ? "Chuyển về Todo" : "Đánh dấu xong"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex flex-col gap-1 min-w-0">
                      <KanbanBoardCardTitle className={`text-white drop-shadow-md line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                        {normalizedCard.title}
                      </KanbanBoardCardTitle>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">{shouldShowDateRow && <DateRow className="text-white/80" />}<PriorityMark className="text-white/80" /></div>
                </div>
              </div>
            ) : normalizedCard.coverColor ? (
              <div className="relative flex w-full flex-col overflow-hidden rounded-md">
                <div aria-hidden="true" className="-mx-3 -mt-3 mb-1 h-8" style={{ backgroundColor: normalizedCard.coverColor }} />
                {normalizedCard.isTemplate && (
                  <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-card/90 text-[10px] font-medium text-foreground">
                    <LayoutTemplate className="h-3 w-3" />
                    Mẫu
                  </div>
                )}
                <div className="w-full pt-1">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            onClick={handleToggleComplete}
                            className={`flex-shrink-0 cursor-pointer transition-opacity ${isDone ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                            role="checkbox"
                            aria-checked={isDone}
                            aria-label={isDone ? "Chuyển về Todo" : "Đánh dấu xong (chuyển sang Done)"}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") handleToggleComplete(e);
                            }}
                          >
                            <div className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                              isDone
                                ? 'bg-status-done border-status-done flex items-center justify-center'
                                : 'border-muted-foreground/60 hover:border-foreground'
                            }`}>
                              {isDone && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isDone ? "Chuyển về Todo" : "Đánh dấu xong"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="flex flex-col gap-1 min-w-0">
                      <KanbanBoardCardTitle className={`line-clamp-2 ${normalizedCard.completed ? "line-through opacity-75" : ""}`}>
                        {normalizedCard.title}
                      </KanbanBoardCardTitle>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">{shouldShowDateRow && <DateRow className="text-muted-foreground" />}<PriorityMark className="text-muted-foreground" /></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pt-1">
                 {normalizedCard.isTemplate && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground text-[10px] font-medium max-w-fit mb-0.5">
                    <LayoutTemplate className="h-3 w-3" />
                    Mẫu
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={handleToggleComplete}
                          className={`flex-shrink-0 cursor-pointer transition-opacity ${isDone ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                          role="checkbox"
                          aria-checked={isDone}
                          aria-label={isDone ? "Chuyển về Todo" : "Đánh dấu xong (chuyển sang Done)"}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleToggleComplete(e);
                          }}
                        >
                          <div className={`h-5 w-5 shrink-0 rounded-full border-2 ring-offset-background ${
                            isDone
                              ? 'bg-status-done border-status-done flex items-center justify-center'
                              : 'border-primary/50 hover:border-primary'
                          }`}>
                            {isDone && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isDone ? "Chuyển về Todo" : "Đánh dấu xong"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <KanbanBoardCardTitle className={`line-clamp-2 ${isDone ? "!text-muted-foreground line-through" : ""}`}>
                    {normalizedCard.title}
                  </KanbanBoardCardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-1">{shouldShowDateRow && <DateRow className="text-muted-foreground px-6" />}<PriorityMark className="text-muted-foreground px-6" /></div>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Thao tác với task ${normalizedCard.title}`}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-1.5 right-1.5 z-20 grid size-7 place-items-center rounded-md bg-card/80 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={openCardDialog}>Mở chi tiết</DropdownMenuItem>
                {otherLists.length > 0 && <DropdownMenuSeparator />}
                {otherLists.map((l) => (
                  <DropdownMenuItem key={l.id} onSelect={() => onMoveTo(l.id)}>
                    Chuyển sang {l.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!canMoveUp} onSelect={() => onMoveBy(-1)}>Lên trên</DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveDown} onSelect={() => onMoveBy(1)}>Xuống dưới</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleDelete}>Xoá task</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </KanbanBoardCard>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={openCardDialog}>Mở chi tiết</ContextMenuItem>
          {otherLists.map((l) => (
            <ContextMenuItem key={l.id} onClick={() => onMoveTo(l.id)}>
              Chuyển sang {l.name}
            </ContextMenuItem>
          ))}
          <ContextMenuItem disabled={!canMoveUp} onClick={() => onMoveBy(-1)}>Lên trên</ContextMenuItem>
          <ContextMenuItem disabled={!canMoveDown} onClick={() => onMoveBy(1)}>Xuống dưới</ContextMenuItem>
          <ContextMenuItem variant="destructive" onClick={handleDelete}>Xoá task</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <ConfirmDialog />
    </KanbanBoardColumnListItem>
  );
}
