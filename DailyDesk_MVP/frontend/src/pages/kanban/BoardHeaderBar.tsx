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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  /** Phần trăm task đã xong, cho thanh tiến độ cạnh tên board. */
  progress?: number;
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
  progress = 0,
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
    toast.success("Đã sao chép link");
  };

  // Handle delete board
  const handleDeleteBoard = async () => {
    if (!isOwner) {
      toast.error("Chỉ chủ board mới xoá được board này");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBoard(boardId);
      toast.success("Đã xoá board");
      setIsDeleteDialogOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast.error("Không xoá được board. Thử lại nhé.");
    } finally {
      setIsDeleting(false);
    }
  };

  const allMembers = [...members];
  // If owner exists and is not in members list, add them to the start
  if (ownerInfo) {
    const isOwnerInMembers = members.some((m) => m.userId === ownerInfo.userId);
    if (!isOwnerInMembers) {
      allMembers.unshift({
        id: ownerInfo.userId,
        userId: ownerInfo.userId,
        name: ownerInfo.name,
        avatar: ownerInfo.avatar,
      });
    }
  }

  return (
    <>
      <div className="sticky top-1 z-10 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/80 px-4 py-2 backdrop-blur-sm dark:bg-black/30">
        {/* Bên trái: tên board, nút sửa, thanh tiến độ */}
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {boardName}
          </h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Sửa board ${boardName}`}
                className="h-6 w-6 text-foreground/70 hover:bg-muted hover:text-foreground"
                onClick={onEditBoard}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sửa board</TooltipContent>
          </Tooltip>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-1 h-1 w-12 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="tabular">Tiến độ board: {Math.round(progress)}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Bên phải: thành viên (nếu bật), tìm, lọc, sắp xếp, nhãn, thêm */}
        <div className="flex items-center gap-3">
          {SHOW_COLLABORATION && (
            <TooltipProvider>
              <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Quản lý thành viên"
                    className="group hidden cursor-pointer items-center lg:flex"
                  >
                    <span className="flex -space-x-2">
                      {allMembers.slice(0, 5).map((member, index) => {
                        const colorClass = avatarTint(member.id || member.name || String(index));
                        const initials = getInitials(member.name);
                        const isOwnerMember = ownerInfo?.userId === member.userId;

                        return (
                          <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <span className="relative">
                                <Avatar
                                  className={`h-8 w-8 border-2 border-black/30 ring-2 ring-transparent transition-all group-hover:ring-white/30 ${colorClass}`}
                                >
                                  {member.avatar ? (
                                    <AvatarImage src={member.avatar} alt={member.name} />
                                  ) : null}
                                  <AvatarFallback
                                    className={`${colorClass} text-xs font-semibold text-white`}
                                  >
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                {isOwnerMember && (
                                  <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-sm ring-2 ring-black/40">
                                    <KeyRound className="h-2.5 w-2.5" />
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
                        <Avatar className="h-8 w-8 border-2 border-black/30 bg-gray-600">
                          <AvatarFallback className="bg-gray-600 text-xs font-semibold text-white">
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
          )}

          <div className="h-6 w-px bg-border" />

          <TooltipProvider>
            <div className="flex items-center gap-1">
              {/* Ô tìm trong board */}
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-transparent px-2 py-1">
                <Search className="h-3.5 w-3.5 shrink-0 text-foreground/60" aria-hidden="true" />
                <Input
                  type="text"
                  placeholder="Tìm task…"
                  aria-label="Tìm task trong board"
                  value={filters.searchQuery}
                  onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                  className="h-5 w-20 border-none bg-transparent px-0 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 md:w-40"
                />
                {filters.searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xoá từ khoá"
                    className="h-4 w-4 shrink-0 rounded-sm text-foreground/60 hover:bg-muted hover:text-foreground"
                    onClick={() => onFiltersChange({ ...filters, searchQuery: "" })}
                  >
                    <X className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>

              <BoardFilterPopover
                boardId={boardId}
                filters={filters}
                onFiltersChange={onFiltersChange}
              />

              <BoardSortPopover
                sortBy={filters.sortBy}
                onSortChange={(sortBy) => onFiltersChange({ ...filters, sortBy })}
              />

              <Sheet open={isLabelsSheetOpen} onOpenChange={setIsLabelsSheetOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Quản lý nhãn"
                        className="hidden h-8 w-8 text-foreground/70 hover:bg-muted hover:text-foreground md:flex"
                      >
                        <Tags className="h-4 w-4" />
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

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Thêm tuỳ chọn cho board"
                        className="h-8 w-8 text-foreground/70 hover:bg-muted hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Thêm</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép link board
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsLabelsSheetOpen(true)}
                    className="md:hidden"
                  >
                    <Tags className="mr-2 h-4 w-4" />
                    Quản lý nhãn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEditBoard}>
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!isOwner}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xoá board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>

          {SHOW_COLLABORATION && (
            <Button
              variant="outline"
              className="h-8 gap-1.5 px-3"
              onClick={() => setIsMembersSheetOpen(true)}
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span>Chia sẻ</span>
            </Button>
          )}

          {/* Nút chính của board */}
          <Button className="h-8 gap-1.5 px-3" onClick={onAddTask}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Thêm task
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá board</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn xoá <strong>"{boardName}"</strong>? Thao tác này không hoàn tác
              được. Mọi danh sách, task và dữ liệu trong board sẽ bị xoá vĩnh viễn.
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xoá…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
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
