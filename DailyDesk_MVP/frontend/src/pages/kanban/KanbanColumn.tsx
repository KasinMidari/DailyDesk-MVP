import { useRef, useEffect } from "react";
import {
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  type KanbanBoardDropDirection,
} from "@/components/kanban";
import { AddCardForm } from "./AddCardForm";
import { ColumnHeader } from "./ColumnHeader";
import { KanbanCard } from "./KanbanCard";
import { statusFromList, type Status } from "@/features/tasks/api";

// Backend card structure
interface BackendCard {
  id: string;
  name: string;
  order: number;
  listId: string;
  repeatFrequency?: "daily" | "weekly" | "monthly" | null;
  repeatInterval?: number | null;
}

interface KanbanColumnProps {
  column: {
    id: string;
    name: string;
    cards: BackendCard[];
  };
  boardId: string;
  onDropOverColumn: (data: string, type: "card" | "column") => void;
  onDropOverListItem: (
    targetCardId: string,
    data: string,
    direction: KanbanBoardDropDirection
  ) => void;
  onSaveColumnEdit: (columnId: string, newName: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteCard: (cardId: string) => void;
  index: number;
  allLists: { id: string; name: string }[];
  onMoveCardTo: (cardId: string, listId: string) => void;
  onMoveCardBy: (cardId: string, delta: -1 | 1) => void;
  onSetCardStatus: (cardId: string, status: Status) => void;
  onMoveColumnBy: (delta: -1 | 1) => void;
}

export function KanbanColumn({
  column,
  boardId,
  onDropOverColumn,
  onDropOverListItem,
  onSaveColumnEdit,
  onDeleteColumn,
  onDeleteCard,
  index,
  allLists,
  onMoveCardTo,
  onMoveCardBy,
  onSetCardStatus,
  onMoveColumnBy,
}: KanbanColumnProps) {
  const position = allLists.findIndex((l) => l.id === column.id);
  const isDoneList = statusFromList(column.name) === "done";
  const sortedIds = [...column.cards].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((c) => c.id);
  const listRef = useRef<HTMLUListElement>(null);
  const prevCardCount = useRef(column.cards.length);

  useEffect(() => {
    if (column.cards.length > prevCardCount.current) {
      if (listRef.current) {
        // Use setTimeout to ensure the DOM has updated with the new card before scrolling
        setTimeout(() => {
           listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        }, 0);
      }
    }
    prevCardCount.current = column.cards.length;
  }, [column.cards.length]);

  return (
    <KanbanBoardColumn
      key={column.id}
      id={`list-${column.id}`}
      className="max-h-full h-auto"
      columnId={column.id}
      onDropOverColumn={onDropOverColumn}
      index={index}
    >
      <KanbanBoardColumnHeader>
        <ColumnHeader
          columnId={column.id}
          columnName={column.name}
          onSave={onSaveColumnEdit}
          onDelete={onDeleteColumn}
          cardCount={column.cards.length}
          canMoveLeft={position > 0}
          canMoveRight={position >= 0 && position < allLists.length - 1}
          onMoveBy={onMoveColumnBy}
        />
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList ref={listRef}>
        {column.cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            columnId={column.id}
            boardId={boardId}
            onDropOverListItem={(data, direction) =>
              onDropOverListItem(card.id, data, direction)
            }
            onDelete={onDeleteCard}
            otherLists={allLists.filter((l) => l.id !== column.id)}
            canMoveUp={sortedIds.indexOf(card.id) > 0}
            canMoveDown={sortedIds.indexOf(card.id) < sortedIds.length - 1}
            isDone={isDoneList}
            onMoveTo={(listId) => onMoveCardTo(card.id, listId)}
            onMoveBy={(delta) => onMoveCardBy(card.id, delta)}
            onToggleDone={() => onSetCardStatus(card.id, isDoneList ? "todo" : "done")}
          />
        ))}
      </KanbanBoardColumnList>

      <AddCardForm columnId={column.id} cardsCount={column.cards.length} />
    </KanbanBoardColumn>
  );
}
