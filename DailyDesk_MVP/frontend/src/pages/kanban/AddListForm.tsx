import { kanbanBoardColumnClassNames } from "@/components/kanban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { isAddingListAtom, newListTitleAtom } from "./atoms";

interface AddListFormProps {
  onAddList: (title: string) => void;
}

export function AddListForm({ onAddList }: AddListFormProps) {
  const [isAddingList, setIsAddingList] = useAtom(isAddingListAtom);
  const [newListTitle, setNewListTitle] = useAtom(newListTitleAtom);
  const addListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isAddingList &&
        addListRef.current &&
        !addListRef.current.contains(event.target as Node)
      ) {
        setIsAddingList(false);
        setNewListTitle("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddingList, setIsAddingList, setNewListTitle]);

  const handleAdd = () => {
    if (newListTitle.trim()) {
      onAddList(newListTitle);
      setNewListTitle("");
      setIsAddingList(false);
    }
  };

  const handleCancel = () => {
    setIsAddingList(false);
    setNewListTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isAddingList) {
    return (
      <div ref={addListRef} className={kanbanBoardColumnClassNames}>
        <div className="px-2 space-y-2">
          <Input
            autoFocus
            placeholder="Nhập tên danh sách…"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-background"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newListTitle.trim()}>
              Thêm
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="ml-auto"
            >
              Huỷ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className="h-fit w-64 shrink-0 justify-start border bg-card px-3 py-2 text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-colors hover:bg-accent"
      onClick={() => setIsAddingList(true)}
    >
      <PlusIcon className="mr-2 size-4 " />
      Thêm danh sách
    </Button>
  );
}
