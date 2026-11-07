import { CardCreateDialog, CardEditDialog } from "@/components/card-edit-dialog";
import {
  KanbanBoard,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { useBoard, useUpdateBoard } from "@/hooks/use-board";
import { useUpdateCard, useDeleteCard, useCreateCard } from "@/hooks/use-card";
import { useUpdateDue } from "@/hooks/use-due";
import { useListActions } from "@/hooks/use-list";
import { useMembers } from "@/hooks/use-member";
import { useUploadImage } from "@/hooks/use-image";
import type { Card as CardType } from "@/types/card";
import { EventCalendar, type CalendarEvent } from "@/components/event-calendar";
import { listsCardsToCalendarEvents } from "@/components/event-calendar/utils";
import { useAtom, useSetAtom } from "jotai";
import { useDraggableScroll } from "@/hooks/use-draggable-scroll";
import { useEffect, useState, useMemo } from "react";
import { AddListForm } from "./AddListForm";
import {
  boardIdAtom,
  isCardDialogOpenAtom,
  selectedCardAtom,
} from "./atoms";
import { KanbanColumn } from "./KanbanColumn";
import { Button } from "@/components/ui/button";
import { BoardHeaderBar } from "./BoardHeaderBar";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { cardMatchesFilters, emptyFilterState, type FilterState } from "@/components/board-filter-popover";
import { useAuth0 } from "@/lib/auth";
import { toast } from "sonner";
import { useSearchParams, useParams } from "react-router";
import { BoardEventsProvider } from "@/components/board-events-provider";
import { useQueryClient } from "@tanstack/react-query";
import { uuidv7 } from "uuidv7";
import { request, statusFromList, STATUS_TEXT, type Status } from "@/features/tasks/api";

interface KanbanProps {
  boardId?: string;
}

export function Kanban({ boardId: propBoardId }: KanbanProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { boardId: paramBoardId } = useParams();
  const boardId = propBoardId || paramBoardId;

  const setBoardId = useSetAtom(boardIdAtom);
  const { createList, updateList, deleteList } = useListActions();
  
  // Ensure boardId is available before calling useBoard if possible, 
  // but since we can't conditionally call hooks, we pass it. 
  // If it's undefined, useBoard might throw/fail, but normally the route ensures we have an ID.
  const board = useBoard({ boardId: boardId! }); 
  const lists = board?.lists || [];
  const { user: currentUser } = useAuth0();
  const { data: members = [] } = useMembers(boardId || "");
  const { updateBoard } = useUpdateBoard();
  const { uploadImage } = useUploadImage();

  const [selectedCard, setSelectedCard] = useAtom(selectedCardAtom);
  const [isCardDialogOpen, setIsCardDialogOpen] = useAtom(isCardDialogOpenAtom);
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(emptyFilterState);
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");
  const [isCalendarCreateOpen, setIsCalendarCreateOpen] = useState(false);
  const [calendarCreateDate, setCalendarCreateDate] = useState<Date | null>(null);

  const { mutate: updateCard } = useUpdateCard();
  const { mutate: deleteCard } = useDeleteCard();
  const { mutate: createCard } = useCreateCard();
  const { mutate: updateDue } = useUpdateDue();

  const { ref: scrollRef, isDragging: _isDragging, ...dragEvents } = useDraggableScroll<HTMLDivElement>();

  // Auth0 user has 'sub' field for user ID
  const isOwner = currentUser?.sub === board?.userId;
  
  // Get current user's role from members list
  const currentUserMember = members.find(m => m.userId === currentUser?.sub);
  const currentUserRole = currentUserMember?.role as "admin" | "member" | undefined;
  const isAdmin = currentUserRole === "admin";

  // Get owner info - if current user is owner, use their info
  // Otherwise, we'll need to pass the userId for now (owner display in members list)
  const ownerInfo = isOwner && currentUser ? {
    userId: currentUser.sub!,
    name: currentUser.name || currentUser.nickname || currentUser.email || "Chủ board",
    email: currentUser.email || "",
    avatar: currentUser.picture || null,
  } : board?.userId ? {
    userId: board.userId,
    name: "Chủ board",
    email: "",
    avatar: null,
  } : undefined;

  // Handle URL query parameters for deep linking
  useEffect(() => {
    if (lists.length > 0) {
      const cardId = searchParams.get("cardId");
      if (cardId) {
        for (const list of lists) {
          const card = list.cards.find((c) => c.id === cardId);
          if (card) {
            setSelectedCard(card);
            setIsCardDialogOpen(true);
            
            // Remove the query param to prevent re-opening or conflicting state
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("cardId");
            setSearchParams(newParams, { replace: true });
            return; // Exit after handling cardId
          }
        }
      }

      const listId = searchParams.get("listId");
      if (listId) {
        // Find the list exists in board
        const listExists = lists.some(l => l.id === listId);
        if (listExists) {
           // We need to wait for DOM to be ready or assume it is.
           // Since lists > 0, they should be rendered.
           requestAnimationFrame(() => {
             const listElement = document.getElementById(`list-${listId}`);
             if (listElement) {
                listElement.scrollIntoView({ behavior: "smooth", inline: "center" });
             }
           });

           // Remove listId param
           const newParams = new URLSearchParams(searchParams);
           newParams.delete("listId");
           setSearchParams(newParams, { replace: true });
        }
      }
    }
  }, [searchParams, lists, setSelectedCard, setIsCardDialogOpen, setSearchParams]);

  // Filter and sort lists' cards based on active filters
  const filteredLists = useMemo(() => {
    return lists.map((list) => {
      // First filter by existing filters
      let cards = list.cards.filter((card) => cardMatchesFilters(card, filters));
      
      // Then filter by search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        cards = cards.filter((card) => 
          card.name.toLowerCase().includes(query) ||
          (card.description && card.description.toLowerCase().includes(query))
        );
      }
      
      // Then sort
      const sortedCards = [...cards];
      if (filters.sortBy !== "none") {
        sortedCards.sort((a, b) => {
          switch (filters.sortBy) {
            case "name-asc":
              return a.name.localeCompare(b.name);
            case "name-desc":
              return b.name.localeCompare(a.name);
            case "dueDate-asc":
              if (!a.deadline && !b.deadline) return 0;
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            case "dueDate-desc":
              if (!a.deadline && !b.deadline) return 0;
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
            case "createdAt-asc":
              // Use order as a proxy for creation order (lower order = older)
              return (a.order || 0) - (b.order || 0);
            case "createdAt-desc":
              // Use order as a proxy for creation order (higher order = newer)
              return (b.order || 0) - (a.order || 0);
            default:
              return 0;
          }
        });
      } else {
        // Default sort for cards: order
        sortedCards.sort((a, b) => (a.order || 0) - (b.order || 0));
      }
      
      return { ...list, cards: sortedCards };
    })
    .sort((a, b) => {
       // Sort lists by order
       return (a.order || 0) - (b.order || 0);
    });
  }, [lists, filters]);

  const calendarEvents = useMemo(() => {
    return listsCardsToCalendarEvents(filteredLists);
  }, [filteredLists]);

  // Handle board update
  const handleBoardUpdate = async (
    name: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => {
    if (!boardId) return;

    let backgroundUrl: string | undefined;
    if (backgroundImage) {
      const uploadResult = await uploadImage({ file: backgroundImage, type: "board", id: boardId }) as any;
      backgroundUrl = uploadResult?.secure_url;
    }

    await updateBoard(boardId, {
      id: board.id,
      name,
      lists: [],
      backgroundColor,
      backgroundUrl,
    });

    toast.success("Đã cập nhật board", { position: "bottom-left" });
  };

  useEffect(() => {
    setBoardId(boardId);
  }, [boardId, setBoardId]);

  const handleDropOverColumn = (
    columnId: string,
    dataTransferData: string,
    type: "card" | "column"
  ) => {
    if (!boardId) return;

    if (type === "column") {
      // Handle column reordering
      handleDropColumnOverColumn(columnId, dataTransferData);
      return;
    }

    // Handle card drop
    let cardId: string;
    try {
      const cardData = JSON.parse(dataTransferData);
      cardId = cardData.id;
    } catch (e) {
      console.error("Failed to parse drag data:", e);
      return;
    }

    const targetList = lists.find((l) => l.id === columnId);
    if (!targetList) return;

    const newOrder = targetList.cards.length;

    updateCard({
      boardId,
      cardId,
      listId: columnId,
      order: newOrder,
    });
  };

  const handleDropColumnOverColumn = async (
    targetColumnId: string,
    dataTransferData: string
  ) => {
    try {
      const draggedData = JSON.parse(dataTransferData);
      const draggedColumnId = draggedData.id;
      
      if (draggedColumnId === targetColumnId) return;
      
      // Find the dragged and target columns
      const sortedLists = [...lists].sort((a, b) => (a.order || 0) - (b.order || 0));
      const draggedIndex = sortedLists.findIndex((l) => l.id === draggedColumnId);
      const targetIndex = sortedLists.findIndex((l) => l.id === targetColumnId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;
      
      // Calculate new order for the dragged column
      let newOrder: number;
      if (targetIndex === 0) {
        // Moving to the beginning
        newOrder = (sortedLists[0].order || 0) - 10000;
      } else if (targetIndex === sortedLists.length - 1) {
        // Moving to the end
        newOrder = (sortedLists[sortedLists.length - 1].order || 0) + 10000;
      } else if (draggedIndex < targetIndex) {
        // Moving right: place after target
        const afterOrder = sortedLists[targetIndex].order || 0;
        const nextOrder = sortedLists[targetIndex + 1]?.order || afterOrder + 20000;
        newOrder = Math.floor((afterOrder + nextOrder) / 2);
      } else {
        // Moving left: place before target
        const beforeOrder = sortedLists[targetIndex].order || 0;
        const prevOrder = sortedLists[targetIndex - 1]?.order || beforeOrder - 20000;
        newOrder = Math.floor((prevOrder + beforeOrder) / 2);
      }
      
      await updateList(draggedColumnId, { order: newOrder });
    } catch (e) {
      console.error("Failed to reorder column:", e);
      toast.error("Không sắp xếp lại được danh sách", { position: "bottom-left" });
    }
  };

  const handleDropOverListItem = (
    columnId: string,
    targetCardId: string,
    dataTransferData: string,
    dropDirection: KanbanBoardDropDirection
  ) => {
    if (!boardId) return;

    let draggedCardId: string;
    try {
      const cardData = JSON.parse(dataTransferData);
      draggedCardId = cardData.id;
    } catch (e) {
      console.error("Failed to parse drag data:", e);
      return;
    }

    if (draggedCardId === targetCardId) return;

    const targetList = lists.find((l) => l.id === columnId);
    if (!targetList) return;

    const targetCard = targetList.cards.find((c) => c.id === targetCardId);
    if (!targetCard) return;

    let newOrder = targetCard.order || 0;
    if (dropDirection === "bottom") {
      newOrder += 1;
    }

    updateCard({
      boardId,
      cardId: draggedCardId,
      listId: columnId,
      order: newOrder,
    });
  };

  const handleAddList = async (title: string) => {
    try {
      // Calculate next order
      const maxOrder = lists.reduce((max, list) => Math.max(max, list.order || 0), 0);
      const nextOrder = maxOrder + 10000;
      
      await createList({
        name: title,
        order: nextOrder,
      });
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleSaveColumnEdit = async (columnId: string, newName: string) => {
    try {
      await updateList(columnId, { name: newName });
      toast.success("Đã cập nhật danh sách", { position: "bottom-left" });
    } catch (error) {
      console.error("Failed to update list:", error);
      toast.error("Không cập nhật được danh sách", { position: "bottom-left" });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteList(columnId);
      toast.success("Đã xoá danh sách", { position: "bottom-left" });
    } catch (error) {
      console.error("Failed to delete list:", error);
      toast.error("Không xoá được danh sách", { position: "bottom-left" });
    }
  };

  const handleUpdateCard = (updatedCard: CardType) => {
    // TODO: Connect this to a backend mutation/hook.
    setSelectedCard(updatedCard);
  };

  const handleEventAdd = (event: CalendarEvent) => {
    if (!boardId) return;

    const targetListId = event.listId || lists[0]?.id;
    if (!targetListId) {
      toast.error("Hãy tạo danh sách trước", { position: "bottom-left" });
      return;
    }

    createCard(
      {
        boardId,
        listId: targetListId,
        name: event.title || "(no title)",
        description: event.description || undefined,
        labels: event.labels,
        members: event.members,
        startDate: event.startDate ? new Date(event.startDate).toISOString() : undefined,
        dueAt: event.dueAt ? new Date(event.dueAt).toISOString() : undefined,
        dueComplete: event.dueComplete ?? false,
        reminderMinutes: event.reminderMinutes ?? null,
        repeatFrequency: event.repeatFrequency ?? null,
        repeatInterval: event.repeatInterval ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Đã tạo sự kiện", { position: "bottom-left" });
        },
        onError: () => {
          toast.error("Không tạo được sự kiện", { position: "bottom-left" });
        },
      },
    );
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    if (!boardId || !event.id) return;
    const baseEventId = event.id.includes("-recurring-")
      ? event.id.split("-recurring-")[0]
      : event.id;
    const nextStartDate = event.startDate ? new Date(event.startDate) : null;
    const nextDueAt = event.dueAt ? new Date(event.dueAt) : null;
    if (nextDueAt && nextDueAt.getTime() < Date.now()) {
      toast.error("Không lưu được: hạn chót không được trước hôm nay", {
        position: "bottom-left",
        className: "text-base",
      });
      return false;
    }
    if (nextStartDate && nextDueAt && nextStartDate.getTime() > nextDueAt.getTime()) {
      toast.error("Ngày bắt đầu không được sau hạn chót", { position: "bottom-left" });
      return false;
    }

    updateCard({
      boardId,
      cardId: baseEventId,
      name: event.title,
      description: event.description ?? null,
      listId: event.listId,
      labels: event.labels ?? null,
      members: event.members ?? null,
    });

    updateDue({
      boardId,
      cardId: baseEventId,
      startDate: nextStartDate ? nextStartDate.toISOString() : null,
      dueAt: nextDueAt ? nextDueAt.toISOString() : null,
      dueComplete: event.dueComplete ?? false,
      reminderMinutes: event.reminderMinutes ?? null,
      repeatFrequency: event.repeatFrequency ?? null,
      repeatInterval: event.repeatInterval ?? null,
    });
    return true;
  };

  const handleEventDelete = (eventId: string) => {
    if (!boardId) return;
    deleteCard({ boardId, cardId: eventId });
  };

  const handleOpenCalendarCreate = (date?: Date) => {
    if (!lists.length) {
      toast.error("Hãy tạo danh sách trước", { position: "bottom-left" });
      return;
    }
    if (date && date.getTime() < Date.now()) {
      toast.error("Hạn chót không được ở quá khứ", { position: "bottom-left" });
      return;
    }
    setCalendarCreateDate(date ?? null);
    setIsCalendarCreateOpen(true);
  };

  const handleCalendarEventSelect = (event: CalendarEvent) => {
    const eventId = event.id.includes("-recurring-")
      ? event.id.split("-recurring-")[0]
      : event.id;
    const selected = lists
      .flatMap((list) => list.cards)
      .find((card) => card.id === eventId);
    if (!selected) return false;
    setSelectedCard(selected as CardType);
    setIsCardDialogOpen(true);
    return true;
  };

  const queryClient = useQueryClient();

  const sortedCardsOf = (listId: string) =>
    [...(lists.find((l) => l.id === listId)?.cards ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /** Chuyển thẻ sang danh sách khác bằng menu (không cần kéo-thả). */
  const handleMoveCardTo = (cardId: string, toListId: string) => {
    if (!boardId) return;
    const target = lists.find((l) => l.id === toListId);
    if (!target) return;
    const maxOrder = target.cards.reduce((m, c) => Math.max(m, c.order ?? 0), -1);
    updateCard(
      { boardId, cardId, listId: toListId, order: maxOrder + 1 },
      {
        onSuccess: () => toast.success(`Đã chuyển sang ${target.name}`, { position: "bottom-left" }),
        onError: () => toast.error("Không chuyển được task", { position: "bottom-left" }),
      },
    );
  };

  /** Đổi chỗ thẻ với thẻ ngay trên/dưới trong cùng danh sách. */
  const handleMoveCardBy = (cardId: string, listId: string, delta: -1 | 1) => {
    if (!boardId) return;
    const cards = sortedCardsOf(listId);
    const i = cards.findIndex((c) => c.id === cardId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= cards.length) return;
    const a = cards[i];
    const b = cards[j];
    const ao = a.order ?? i;
    let bo = b.order ?? j;
    if (ao === bo) bo = ao + delta;
    updateCard({ boardId, cardId: a.id, order: bo });
    updateCard({ boardId, cardId: b.id, order: ao });
  };

  /** Ô "đánh dấu xong" = chuyển sang danh sách Done (bỏ đánh dấu = về Todo). */
  const handleSetCardStatus = (cardId: string, status: Status) => {
    const target = [...lists]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .find((l) => statusFromList(l.name) === status);
    if (!target) {
      toast.error(`Board này chưa có danh sách ${STATUS_TEXT[status]}`, { position: "bottom-left" });
      return;
    }
    handleMoveCardTo(cardId, target.id);
  };

  /** Đổi chỗ danh sách với danh sách bên trái/phải. */
  const handleMoveColumnBy = async (columnId: string, delta: -1 | 1) => {
    const sorted = [...lists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const i = sorted.findIndex((l) => l.id === columnId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const ao = sorted[i].order ?? i;
    let bo = sorted[j].order ?? j;
    if (ao === bo) bo = ao + delta;
    try {
      await updateList(sorted[i].id, { order: bo });
      await updateList(sorted[j].id, { order: ao });
    } catch {
      toast.error("Không sắp xếp lại được danh sách", { position: "bottom-left" });
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (!boardId) return;
    
    deleteCard(
      { boardId, cardId },
      {
        onSuccess: () => {
          setIsCardDialogOpen(false);
          setSelectedCard(null);
          const snapshot = lists.flatMap((l) => l.cards).find((c) => c.id === cardId) as
            | (Record<string, unknown> & { name: string; listId: string })
            | undefined;
          toast("Đã xoá task", {
            position: "bottom-left",
            description: snapshot?.name,
            action: snapshot
              ? {
                  label: "Hoàn tác",
                  onClick: async () => {
                    try {
                      await request("POST", `/boards/${boardId}/cards`, {
                        ...snapshot,
                        id: uuidv7(),
                        labels: (snapshot.labels as unknown[] | undefined) ?? [],
                        members: [],
                      });
                      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
                      queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    } catch {
                      toast.error("Không khôi phục được task", { position: "bottom-left" });
                    }
                  },
                }
              : undefined,
          });
        },
        onError: () => {
          toast.error("Không xoá được task", { position: "bottom-left" });
        },
      }
    );
  };

  // Câu dữ liệu dưới H1. "Xong" tính theo danh sách Done — đúng thứ ô tick trên thẻ nói.
  const totalCards = lists.reduce((acc, list) => acc + list.cards.length, 0);
  const doneCards = lists.reduce(
    (acc, list) => (statusFromList(list.name) === "done" ? acc + list.cards.length : acc),
    0,
  );
  const overdueCards = lists.reduce((acc, list) => {
    if (statusFromList(list.name) === "done") return acc;
    return (
      acc +
      list.cards.filter((card) => {
        const due = (card as { dueAt?: string | null; deadline?: string | null }).dueAt ??
          (card as { deadline?: string | null }).deadline;
        return !!due && new Date(due).getTime() < Date.now();
      }).length
    );
  }, 0);

  const progress = totalCards === 0 ? 0 : (doneCards / totalCards) * 100;

  const isCalendarView = viewMode === "calendar";

  /** Nút chính của màn: thêm task vào danh sách đầu tiên. */
  const handleOpenAddTask = () => {
    if (!lists.length) {
      toast.error("Hãy tạo danh sách trước", { position: "bottom-left" });
      return;
    }
    setCalendarCreateDate(null);
    setIsCalendarCreateOpen(true);
  };

  return (
    <BoardEventsProvider boardId={boardId || ""}>
      <KanbanBoardProvider>
      <div
        className={`relative flex h-full w-full flex-1 flex-col overflow-hidden ${isCalendarView ? "" : "p-4"}`}
          style={{
            // Ảnh nền hoặc màu của board phủ kín mặt làm việc.
            backgroundImage: board.backgroundUrl ? `url(${board.backgroundUrl})` : undefined,
            backgroundColor: board.backgroundColor ?? undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {!isCalendarView && (
            <BoardHeaderBar
              boardId={boardId || ""}
              boardName={board.name}
              members={members}
              isOwner={isOwner}
              isAdmin={isAdmin}
              currentUserRole={currentUserRole}
              creatorId={board?.userId || ""}
              currentUserId={currentUser?.sub || ""}
              ownerInfo={ownerInfo}
              filters={filters}
              onFiltersChange={setFilters}
              onEditBoard={() => setIsEditBoardOpen(true)}
              progress={progress}
              onAddTask={handleOpenAddTask}
            />
          )}

          {/* Đổi chế độ xem: nút nổi giữa đáy canvas, như bản gốc */}
          <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1 shadow-lg backdrop-blur">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setViewMode("kanban")}
              >
                Kanban
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setViewMode("calendar")}
              >
                Lịch
              </Button>
            </div>
          </div>

          {isCalendarView ? (
            <div className="absolute inset-0 z-20 overflow-y-auto">
              <div className="min-h-full w-full bg-background">
              <EventCalendar
                events={calendarEvents}
                initialView="month"
                boardId={boardId || ""}
                lists={lists.map((list) => ({ id: list.id, title: list.name }))}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                createLabel="Thêm task"
                onCreateClick={handleOpenCalendarCreate}
                onEventSelect={handleCalendarEventSelect}
              />
              </div>
            </div>
          ) : (
            <KanbanBoard ref={scrollRef} {...dragEvents} className="cursor-grab active:cursor-grabbing pb-24 flex-1 overflow-x-auto overflow-y-auto items-start">
              {filteredLists.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  boardId={boardId || ""}
                  onDropOverColumn={(data, type) => handleDropOverColumn(column.id, data, type)}
                  onDropOverListItem={(targetCardId, data, direction) =>
                    handleDropOverListItem(column.id, targetCardId, data, direction)
                  }
                  onSaveColumnEdit={handleSaveColumnEdit}
                  onDeleteColumn={handleDeleteColumn}
                  onDeleteCard={handleDeleteCard}
                  index={index}
                  allLists={[...lists]
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((l) => ({ id: l.id, name: l.name }))}
                  onMoveCardTo={handleMoveCardTo}
                  onMoveCardBy={(cardId, delta) => handleMoveCardBy(cardId, column.id, delta)}
                  onSetCardStatus={handleSetCardStatus}
                  onMoveColumnBy={(delta) => handleMoveColumnBy(column.id, delta)}
                />
              ))}

              <AddListForm onAddList={handleAddList} />

              <KanbanBoardExtraMargin />
            </KanbanBoard>
          )}

          <CardEditDialog
            card={selectedCard}
            boardId={boardId || ""}
            isOpen={isCardDialogOpen}
            onClose={() => {
              setIsCardDialogOpen(false);
            }}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            ownerInfo={ownerInfo}
            layout={isCalendarView ? "vertical" : "horizontal"}
            hideCommentsActivity={isCalendarView}
          />

          <EditBoardDialog
            open={isEditBoardOpen}
            onOpenChange={setIsEditBoardOpen}
            initialName={board.name}
            initialBackgroundUrl={board.backgroundUrl ?? undefined}
            initialBackgroundColor={board.backgroundColor ?? undefined}
            onSave={handleBoardUpdate}
          />

          {/* Dùng cho cả hai chế độ xem: nút "Thêm task" ở title row và ô ngày trên lịch. */}
          {boardId && lists.length > 0 && (
            <CardCreateDialog
              boardId={boardId}
              listId={lists[0].id}
              order={lists[0].cards.length}
              lists={lists.map((list) => ({
                id: list.id,
                name: list.name,
                cardsCount: list.cards.length,
              }))}
              initialDate={calendarCreateDate}
              compact
              isOpen={isCalendarCreateOpen}
              onClose={() => setIsCalendarCreateOpen(false)}
              onCreated={(card) => {
                setIsCalendarCreateOpen(false);
                setSelectedCard(card);
              }}
            />
          )}
        </div>
      </KanbanBoardProvider>
    </BoardEventsProvider>
  );
}
