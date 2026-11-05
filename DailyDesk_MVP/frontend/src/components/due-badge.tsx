import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Repeat } from "lucide-react";
import { getDueStatus, formatDueDate } from "@/lib/due-status";
import { cn } from "@/lib/utils";
import type { Card } from "@/types/card";

interface DueBadgeProps {
  card: Card;
  onClick?: () => void;
  className?: string;
}

export function DueBadge({ card, onClick, className }: DueBadgeProps) {
  const { dueAt, dueComplete } = card;

  if (!dueAt) return null;

  const { label, color } = getDueStatus(dueAt, dueComplete);
  const formattedDate = formatDueDate(dueAt);

  // Nhãn hạn chót đi theo token của hệ, không mượn bảng màu Tailwind:
  // chỉ quá hạn (đỏ) và đang tới hạn (hổ phách) được tô, đã xong là yên nhất.
  const getBadgeClassName = () => {
    switch (color) {
      case "success":
        return "bg-muted text-muted-foreground";
      case "destructive":
        return "bg-[color-mix(in_oklch,var(--red-ink)_12%,transparent)] text-overdue ring-1 ring-inset ring-[color-mix(in_oklch,var(--red-ink)_40%,transparent)]";
      case "warning":
        return "bg-status-doing-soft text-status-doing";
      case "secondary":
        return "bg-muted text-muted-foreground";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant={color === "default" ? "outline" : "secondary"}
      className={cn(
        "flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors",
        getBadgeClassName(),
        className
      )}
      onClick={onClick}
    >
      {dueComplete ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      <span>{label || formattedDate}</span>
      {label && formattedDate && (
        <span className="ml-1 opacity-80">{formattedDate}</span>
      )}
      {card.repeatFrequency && (
        <Repeat className="w-3 h-3 opacity-70" />
      )}
    </Badge>
  );
}
