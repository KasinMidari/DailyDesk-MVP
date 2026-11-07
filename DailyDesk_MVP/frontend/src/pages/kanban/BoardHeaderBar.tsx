import { SHOW_COLLABORATION } from "@/lib/features";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { formatWeekdayDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { avatarTint } from "@/lib/avatar-colors";
import { BoardFilterPopover, type FilterState } from "@/components/board-filter-popover";
import { BoardSortPopover } from "@/components/board-sort-popover";
import { BoardMembersManager } from "@/components/board-members-manager";
import { LabelManager } from "@/components/label-manager";
import { useDeleteBoard } from "@/hooks/use-board";

import { 
  Tags,
  MoreHorizontal, 
  Share2, 
  Pencil, 
  Copy, 
  Settings, 
  Trash2,
  Loader2,
  Search,
  X,
  KeyRound,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  name: string;
  avatar?: string | null;
}

interface BoardHeaderBarProps {
  boardId: string;
  boardName: string;
  members: Member[];
  isOwner: boolean;
  isAdmin?: boolean;
  currentUserRole?: "admin" | "member";
  creatorId: string;
  currentUserId: string;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onEditBoard: () => void;
  /** Câu dữ liệu dưới H1: bao nhiêu task đã xong, bao nhiêu quá hạn. */
  doneCards: number;
  totalCards: number;
  overdueCards: number;
  viewMode: "kanban" | "calendar";
  onViewModeChange: (mode: "kanban" | "calendar") => void;
  onAddTask: () => void;
}

// Get initials from name
function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function BoardHeaderBar({
  boardId,
  boardName,
  members,
  isOwner,
  isAdmin = false,
  currentUserRole,
  creatorId,
  currentUserId,
  ownerInfo,
  filters,
  onFiltersChange,
  onEditBoard,
  doneCards,
  totalCards,
  overdueCards,
  viewMode,
  onViewModeChange,
  onAddTask,
}: BoardHeaderBarProps) {
  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  const [isLabelsSheetOpen, setIsLabelsSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  
  const { deleteBoard } = useDeleteBoard();

  // Handle copy board link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép link", { position: "bottom-left" });
  };

  // Handle delete board
  const handleDeleteBoard = async () => {
    if (!isOwner) {
      toast.error("Chỉ chủ board mới xoá được board này", { position: "bottom-left" });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBoard(boardId);
      toast.success("Đã xoá board", { position: "bottom-left" });
      setIsDeleteDialogOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast.error("Không xoá được board. Thử lại nhé.", { position: "bottom-left" });
    } finally {
      setIsDeleting(false);
    }
  };

  const allMembers = [...members];
  // If owner exists and is not in members list, add them to the start
  if (ownerInfo) {
    const isOwnerInMembers = members.some(m => m.userId === ownerInfo.userId);
    if (!isOwnerInMembers) {
      allMembers.unshift({
        id: ownerInfo.userId, // Use userId as id for display purposes if not a real member record
        userId: ownerInfo.userId,
        name: ownerInfo.name,
        avatar: ownerInfo.avatar,
      });
    }
  }

  const today = formatWeekdayDate(new Date());

  return (
    <>
      {/* Title row: cùng cấu trúc với màn "Việc của tôi" — ngày, H1, câu dữ liệu, nút chính. */}
      <header className="z-10 shrink-0 flex-wrap items-end justify-between gap-4 pt-1 sm:flex">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{today}</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="font-planner truncate text-[1.75rem] leading-tight font-semibold text-foreground">
              {boardName}
            </h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Sửa board ${boardName}`}
                  className="size-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={onEditBoard}
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sửa board</TooltipContent>
            </Tooltip>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground tabular">
            {totalCards === 0 ? "Board này chưa có task nào." : `${doneCards}/${totalCards} task đã xong`}
            {overdueCards > 0 && (
              <>
                {" · "}
                <span className="font-medium text-overdue">{overdueCards} quá hạn</span>
              </>
            )}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2 sm:mt-0">
          {/* Chế độ xem: segmented control cạnh nút chính, không còn nút nổi ở đáy canvas. */}
          <div
            role="group"
            aria-label="Chế độ xem"
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-input bg-muted p-1"
          >
            {([
              { key: "kanban", label: "Kanban" },
              { key: "calendar", label: "Lịch" },
            ] as const).map((v) => (
              <button
                key={v.key}
                type="button"
                aria-pressed={viewMode === v.key}
                onClick={() => onViewModeChange(v.key)}
                className={cn(
                  "h-7 rounded-sm px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  viewMode === v.key
                    ? "bg-card font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button className="h-9 shrink-0 gap-1.5 px-4" onClick={onAddTask}>
            <Plus className="size-4" aria-hidden="true" />
            Thêm task
          </Button>
        </div>
      </header>

      {/* Hàng lọc: cùng chiều cao control (36px) như màn "Việc của tôi". */}
      <div className="z-10 mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b py-3">
          {/* Action Icons */}
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-1">
              {/* Ô tìm: cao 36px, chữ 14px — đúng dải control của title/filter row. */}
              <div className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="text"
                  placeholder="Tìm task…"
                  aria-label="Tìm task trong board"
                  value={filters.searchQuery}
                  onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                  className="h-7 w-40 border-none bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 md:w-56"
                />
                {filters.searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xoá từ khoá"
                    className="size-6 shrink-0 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => onFiltersChange({ ...filters, searchQuery: "" })}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>

              {/* Filter Popover */}
              <BoardFilterPopover
                boardId={boardId}
                filters={filters}
                onFiltersChange={onFiltersChange}
                triggerClassName="size-9"
              />

              {/* Sort Popover */}
              <BoardSortPopover
                sortBy={filters.sortBy}
                onSortChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
                triggerClassName="size-9"
              />

              {/* Labels Manager */}
              <Sheet open={isLabelsSheetOpen} onOpenChange={setIsLabelsSheetOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Quản lý nhãn"
                        className="hidden size-9 text-muted-foreground hover:bg-muted hover:text-foreground md:flex"
                      >
                        <Tags className="size-4" />
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Nhãn</TooltipContent>
                </Tooltip>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Nhãn của board</SheetTitle>
                    <SheetDescription>
                      Tạo và quản lý nhãn cho <b>{boardName}</b>
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <LabelManager 
                      members={members}
                      creatorId={creatorId}
                      currentUserId={currentUserId}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* More Options Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Thêm tuỳ chọn cho board"
                        className="size-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Thêm</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Sao chép link board
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsLabelsSheetOpen(true)} className="md:hidden">
                    <Tags className="h-4 w-4 mr-2" />
                    Quản lý nhãn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEditBoard}>
                    <Settings className="h-4 w-4 mr-2" />
                    Cài đặt board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!isOwner}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xoá board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>

        {/* Thành viên + Chia sẻ: chỉ hiện khi bật cộng tác. */}
        {SHOW_COLLABORATION && (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
                <SheetTrigger asChild>
                  <button type="button" aria-label="Quản lý thành viên" className="hidden items-center lg:flex">
                    <span className="flex -space-x-2">
                      {allMembers.slice(0, 5).map((member, index) => {
                        const colorClass = avatarTint(member.id || member.name || String(index));
                        const initials = getInitials(member.name);
                        const isOwnerMember = ownerInfo?.userId === member.userId;

                        return (
                          <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <span className="relative">
                                {/* Viền giấy để các avatar chồng nhau vẫn đọc rời. */}
                                <Avatar className={`size-8 border-2 border-card ${colorClass}`}>
                                  {member.avatar ? (
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                  ) : null}
                                  <AvatarFallback className={`${colorClass} text-xs font-semibold text-white`}>
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                {isOwnerMember && (
                                  <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-status-doing-soft text-status-doing ring-1 ring-card">
                                    <KeyRound className="size-2.5" />
                                  </span>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{member.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {allMembers.length > 5 && (
                        <Avatar className="size-8 border-2 border-card bg-muted">
                          <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                            +{allMembers.length - 5}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </span>
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Quản lý thành viên</SheetTitle>
                    <SheetDescription>
                      Thêm hoặc bớt thành viên của <b>{boardName}</b>
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-4 py-6">
                    <BoardMembersManager
                      boardId={boardId}
                      isOwner={isOwner}
                      isAdmin={isAdmin}
                      currentUserRole={currentUserRole}
                      ownerInfo={ownerInfo}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </TooltipProvider>

            <Button variant="outline" className="h-9 gap-1.5 px-3" onClick={() => setIsMembersSheetOpen(true)}>
              <Share2 className="size-4" aria-hidden="true" />
              <span>Chia sẻ</span>
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá board</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xoá <strong>"{boardName}"</strong>? Thao tác này không hoàn tác được.
              Mọi danh sách, task và dữ liệu trong board sẽ bị xoá vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xoá…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xoá board
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
