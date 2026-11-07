import {
  KanbanBoardColumnIconButton,
  KanbanBoardColumnTitle,
} from "@/components/kanban";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, CheckIcon, MoreHorizontal, Pencil, Trash2, XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAtom } from "jotai";
import { editingListIdAtom, editingListTitleAtom } from "./atoms";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { listDisplayName } from "@/features/tasks/api";

interface ColumnHeaderProps {
  columnId: string;
  columnName: string;
  onSave: (columnId: string, newName: string) => void;
  onDelete: (columnId: string) => void;
  cardCount: number;
  /** Danh sách cuối cùng của một trạng thái thì không xoá được. */
  canDelete: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveBy: (delta: -1 | 1) => void;
}

export function ColumnHeader({
  columnId,
  columnName,
  onSave,
  onDelete,
  cardCount,
  canDelete,
  canMoveLeft,
  canMoveRight,
  onMoveBy,
}: ColumnHeaderProps) {
  const [editingListId, setEditingListId] = useAtom(editingListIdAtom);
  const [editingListTitle, setEditingListTitle] = useAtom(editingListTitleAtom);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const isEditing = editingListId === columnId;

  const startEditing = () => {
    setEditingListId(columnId);
    // Ô sửa mở ra đúng chữ đang thấy trên đầu cột, không phải tên tiếng Anh ở dưới dữ liệu.
    setEditingListTitle(listDisplayName(columnName));
  };

  const cancelEdit = () => {
    setEditingListId(null);
    setEditingListTitle("");
  };

  const handleSave = () => {
    if (editingListTitle.trim()) {
      onSave(columnId, editingListTitle.trim());
    }
    cancelEdit();
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Xoá danh sách này?",
      description: `Danh sách "${listDisplayName(columnName)}" và ${cardCount} task trong đó sẽ bị xoá.`,
      confirmText: "Xoá danh sách",
      cancelText: "Giữ lại",
      variant: "destructive"
    });
    if (confirmed) {
      onDelete(columnId);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 items-center w-full">
        <Input
          autoFocus
          value={editingListTitle}
          onChange={(e) => setEditingListTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") cancelEdit();
          }}
          className="h-7 text-sm"
        />
        <KanbanBoardColumnIconButton
          onClick={handleSave}
          disabled={!editingListTitle.trim()}
          aria-label="Lưu tên danh sách"
        >
          <CheckIcon className="size-3.5" />
        </KanbanBoardColumnIconButton>
        <KanbanBoardColumnIconButton onClick={cancelEdit} aria-label="Huỷ đổi tên">
          <XIcon className="size-3.5" />
        </KanbanBoardColumnIconButton>
      </div>
    );
  }

  return (
    <>
      <KanbanBoardColumnTitle columnId={columnId}>
        {listDisplayName(columnName)}
        <span className="ml-2 text-xs font-normal text-muted-foreground tabular">{cardCount}</span>
      </KanbanBoardColumnTitle>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Thao tác với danh sách ${listDisplayName(columnName)}`}
            className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={startEditing}>
            <Pencil className="size-4" />
            Đổi tên
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveLeft} onSelect={() => onMoveBy(-1)}>
            <ArrowLeft className="size-4" />
            Chuyển sang trái
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canMoveRight} onSelect={() => onMoveBy(1)}>
            <ArrowRight className="size-4" />
            Chuyển sang phải
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
                <Trash2 className="size-4" />
                Xoá danh sách
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog />
    </>
  );
}
