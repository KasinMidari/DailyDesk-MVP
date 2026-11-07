import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Clipboard, Users, Clock, ChevronRight } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import CreateBoardDialog from "@/components/create-board-dialog";
import { BoardCard } from "@/components/board-card";
import { DeleteBoardDialog } from "@/components/delete-board-dialog";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { AllBoardsDialog } from "@/components/all-boards-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useBoards,
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from "@/hooks/use-board";
import PageLoader from "./components/full-page-loader";
import { useUploadImage } from "@/hooks/use-image";
import { useAuth0 } from "@/lib/auth";

/** Lưới board: 4 cột ở màn rộng, như bản gốc. */
const BOARD_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

type BoardToEdit = {
  id: string;
  name: string;
  backgroundUrl?: string;
  backgroundColor?: string;
} | null;

type BoardToDelete = {
  id: string;
  name: string;
  hasImage: boolean;
} | null;

const RECENT_BOARDS_KEY_PREFIX = "dailydesk-recent-boards-";
const MAX_RECENT_BOARDS = 4;

// Helper to get recently accessed boards from localStorage (user-specific)
function getRecentBoards(userId: string): string[] {
  try {
    const stored = localStorage.getItem(RECENT_BOARDS_KEY_PREFIX + userId);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to add a board to recently accessed (user-specific)
function addToRecentBoards(userId: string, boardId: string) {
  try {
    let recent = getRecentBoards(userId).filter((id) => id !== boardId);
    recent.unshift(boardId);
    recent = recent.slice(0, MAX_RECENT_BOARDS);
    localStorage.setItem(RECENT_BOARDS_KEY_PREFIX + userId, JSON.stringify(recent));
  } catch {
    // Ignore localStorage errors
  }
}

export default function Home() {
  const { user } = useAuth0();
  const { createBoard } = useCreateBoard();
  const { updateBoard } = useUpdateBoard();
  const { deleteBoard } = useDeleteBoard();
  const { uploadImage } = useUploadImage();

  const { ownedBoards, invitedBoards } = useBoards();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [boardToEdit, setBoardToEdit] = useState<BoardToEdit>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardToDelete>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentBoardIds, setRecentBoardIds] = useState<string[]>([]);
  const [isAllOwnedBoardsOpen, setIsAllOwnedBoardsOpen] = useState(false);
  const [isAllInvitedBoardsOpen, setIsAllInvitedBoardsOpen] = useState(false);

  // Show max 7 boards in grid (2 rows of 4 minus 1 for create button)
  const MAX_DISPLAYED_BOARDS = 7;

  const userId = user?.sub || "";

  // Load recent boards from localStorage on mount and when userId changes
  useEffect(() => {
    if (userId) {
      setRecentBoardIds(getRecentBoards(userId));
    } else {
      setRecentBoardIds([]);
    }
  }, [userId]);

  // Combine all boards for search
  const allBoards = [...ownedBoards, ...invitedBoards];

  // Filter boards by search term and sort by ID descending (newest first)
  const filteredOwnedBoards = ownedBoards
    .filter((board) => board.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.id.localeCompare(a.id));

  const filteredInvitedBoards = invitedBoards.filter((board) =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get recent boards that exist
  const recentBoards = recentBoardIds
    .map((id) => allBoards.find((b) => b.id === id))
    .filter(Boolean)
    .slice(0, MAX_RECENT_BOARDS);

  const handleCreateBoard = async (
    title: string,
    backgroundColor?: string,
    backgroundImage?: File,
    backgroundImageUrl?: string,
  ) => {
    const newBoard = await createBoard({
      name: title,
      backgroundColor,
      // Ảnh chọn từ bộ có sẵn chỉ là một URL: lưu thẳng, không cần tải lên.
      backgroundUrl: backgroundImageUrl ?? "",
    });

    if (backgroundImage) {
      try {
        await uploadImage({
          file: backgroundImage,
          type: "board",
          id: newBoard.id,
        });
      } catch (err) {
        console.error("Upload thất bại", err);
      }
    }
    setIsCreateDialogOpen(false);
  };

  const handleEditBoard = async (
    name: string,
    backgroundColor?: string,
    backgroundImage?: File,
    backgroundImageUrl?: string,
  ) => {
    if (!boardToEdit) return;

    await updateBoard(boardToEdit.id, {
      id: boardToEdit.id,
      name,
      backgroundColor,
      // Gửi cả khi rỗng: chọn lại màu thì phải xoá ảnh nền cũ, không thì
      // ảnh vẫn nằm đó và đè lên màu vừa chọn.
      backgroundUrl: backgroundImageUrl ?? "",
      lists: [],
    });

    if (backgroundImage) {
      try {
        await uploadImage({
          file: backgroundImage,
          type: "board",
          id: boardToEdit.id,
        });
      } catch (err) {
        console.error("Upload thất bại", err);
      }
    }

    setBoardToEdit(null);
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;
    await deleteBoard(boardToDelete.id, boardToDelete.hasImage);
    setBoardToDelete(null);
  };

  const handleBoardClick = (boardId: string) => {
    if (userId) {
      addToRecentBoards(userId, boardId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "member":
        return "bg-sky-400/20 text-sky-600 border-sky-600/30";
      case "viewer":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-6 pb-20">
        {/* Header with Search */}
        <header className="flex shrink-0 flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Board</h1>
            <p className="mt-1 text-muted-foreground">Gom task theo môn học hoặc dự án</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search
              className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Tìm board…"
              aria-label="Tìm board"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {/* Recent Boards Section (only show if there are recent boards) */}
        {!searchTerm && recentBoards.length > 0 && allBoards.length > MAX_RECENT_BOARDS && (
          <section className="w-full">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Mở gần đây</h2>
            </div>
            <div className={BOARD_GRID}>
              {recentBoards.map((board: any) => (
                <div key={board.id} onClick={() => handleBoardClick(board.id)}>
                  <BoardCard
                    id={board.id}
                    name={board.name}
                    lists={(board as any).lists}
                    backgroundUrl={board.backgroundUrl ?? undefined}
                    backgroundColor={board.backgroundColor ?? undefined}
                    onEdit={() =>
                      setBoardToEdit({
                        id: board.id,
                        name: board.name,
                        backgroundUrl: board.backgroundUrl ?? undefined,
                        backgroundColor: board.backgroundColor ?? undefined,
                      })
                    }
                    onDelete={() =>
                      setBoardToDelete({
                        id: board.id,
                        name: board.name,
                        hasImage: !!board.backgroundUrl,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Boards Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clipboard className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Board của tôi</h2>
              <Badge variant="secondary" className="ml-1 tabular">
                {filteredOwnedBoards.length}
              </Badge>
            </div>
            {filteredOwnedBoards.length > MAX_DISPLAYED_BOARDS && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAllOwnedBoardsOpen(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                Xem tất cả
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className={BOARD_GRID}>
            {/* Create New Board Card - Always visible */}
            <Card
              className="flex w-full min-h-[120px] cursor-pointer flex-col items-start justify-center border-2 border-dashed border-gray-500 transition-all hover:border-gray-400 hover:bg-gray-300/20"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <CardContent className="flex w-full flex-col items-center gap-2">
                <Plus className="mb-2 h-8 w-8 text-gray-500" />
                <p className="text-sm font-medium text-gray-700 dark:text-white">Tạo board mới</p>
              </CardContent>
            </Card>

            {searchTerm && filteredOwnedBoards.length === 0 && (
              <p className="self-center text-sm text-muted-foreground">
                Không có board nào tên “{searchTerm}”.
              </p>
            )}

            {filteredOwnedBoards.slice(0, MAX_DISPLAYED_BOARDS).map((board) => (
              <div key={board.id} onClick={() => handleBoardClick(board.id)}>
                <BoardCard
                  id={board.id}
                  name={board.name}
                  lists={(board as any).lists}
                  backgroundUrl={board.backgroundUrl ?? undefined}
                  backgroundColor={board.backgroundColor ?? undefined}
                  onEdit={() =>
                    setBoardToEdit({
                      id: board.id,
                      name: board.name,
                      backgroundUrl: board.backgroundUrl ?? undefined,
                      backgroundColor: board.backgroundColor ?? undefined,
                    })
                  }
                  onDelete={() =>
                    setBoardToDelete({
                      id: board.id,
                      name: board.name,
                      hasImage: !!board.backgroundUrl,
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Invited Boards Section */}
        {filteredInvitedBoards.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Board được mời</h2>
                <Badge variant="secondary" className="ml-1 tabular">
                  {filteredInvitedBoards.length}
                </Badge>
              </div>
              {filteredInvitedBoards.length > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAllInvitedBoardsOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Xem tất cả
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
            <div className={BOARD_GRID}>
              {filteredInvitedBoards.slice(0, 8).map((board: any) => (
                <div
                  key={board.id}
                  className="relative"
                  onClick={() => handleBoardClick(board.id)}
                >
                  <BoardCard
                    id={board.id}
                    name={board.name}
                    lists={(board as any).lists}
                    backgroundUrl={board.backgroundUrl ?? undefined}
                    backgroundColor={board.backgroundColor ?? undefined}
                    onEdit={() =>
                      setBoardToEdit({
                        id: board.id,
                        name: board.name,
                        backgroundUrl: board.backgroundUrl ?? undefined,
                        backgroundColor: board.backgroundColor ?? undefined,
                      })
                    }
                    onDelete={() =>
                      setBoardToDelete({
                        id: board.id,
                        name: board.name,
                        hasImage: !!board.backgroundUrl,
                      })
                    }
                  />
                  {/* Role Badge */}
                  <Badge
                    className={`absolute top-2 right-2 text-xs ${getRoleBadgeColor(board.role)}`}
                  >
                    {board.role === "admin" ? "Quản trị" : "Thành viên"}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state for invited boards when searching */}
        {searchTerm && filteredInvitedBoards.length === 0 && invitedBoards.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Board được mời</h2>
            </div>
            <p className="text-sm text-muted-foreground">Không có board được mời nào khớp.</p>
          </section>
        )}

        {/* Dialogs */}
        <CreateBoardDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreate={handleCreateBoard}
        />

        <EditBoardDialog
          open={!!boardToEdit}
          onOpenChange={(open) => !open && setBoardToEdit(null)}
          initialName={boardToEdit?.name ?? ""}
          initialBackgroundUrl={boardToEdit?.backgroundUrl}
          initialBackgroundColor={boardToEdit?.backgroundColor}
          onSave={handleEditBoard}
        />

        <DeleteBoardDialog
          open={!!boardToDelete}
          onOpenChange={(open) => !open && setBoardToDelete(null)}
          boardName={boardToDelete?.name ?? ""}
          onConfirm={handleDeleteBoard}
        />

        {/* See All Owned Boards Dialog */}
        <AllBoardsDialog
          open={isAllOwnedBoardsOpen}
          onOpenChange={setIsAllOwnedBoardsOpen}
          boards={ownedBoards}
          title={`Tất cả board của tôi (${ownedBoards.length})`}
          onBoardClick={handleBoardClick}
          onEdit={(board) =>
            setBoardToEdit({
              id: board.id,
              name: board.name,
              backgroundUrl: board.backgroundUrl ?? undefined,
              backgroundColor: board.backgroundColor ?? undefined,
            })
          }
          onDelete={(board) =>
            setBoardToDelete({
              id: board.id,
              name: board.name,
              hasImage: !!board.backgroundUrl,
            })
          }
        />

        {/* See All Invited Boards Dialog */}
        <AllBoardsDialog
          open={isAllInvitedBoardsOpen}
          onOpenChange={setIsAllInvitedBoardsOpen}
          boards={invitedBoards}
          title={`Tất cả board được mời (${invitedBoards.length})`}
          onBoardClick={handleBoardClick}
        />
      </div>
    </Suspense>
  );
}
