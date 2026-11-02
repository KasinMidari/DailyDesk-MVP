import { SHOW_COLLABORATION } from "@/lib/features";
import {
  User,
  Tag,
  Clock,
  Paperclip,
  Image,
  ArrowRight,
  Copy,
  Archive,
  Trash2,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CardActionsSidebarProps {
  onMembersClick?: () => void;
  onLabelsClick?: () => void;
  onDatesClick?: () => void;
  onAttachmentClick?: () => void;
  onCoverClick?: () => void;
  onMoveClick?: () => void;
  onCopyClick?: () => void;
  onArchiveClick?: () => void;
  onDeleteClick?: () => void;
  onMakeTemplateClick?: () => void;
  isTemplate?: boolean;
}

export function CardActionsSidebar({
  onMembersClick,
  onLabelsClick,
  onDatesClick,
  onAttachmentClick,
  onCoverClick,
  onMoveClick,
  onCopyClick,
  onArchiveClick,
  onDeleteClick,
  onMakeTemplateClick,
  isTemplate,
}: CardActionsSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Add to card section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Thêm vào task
        </p>

        <div className="space-y-1">
          {SHOW_COLLABORATION && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={onMembersClick}
            >
              <User className="w-4 h-4 mr-2" />
              Thành viên
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onLabelsClick}
          >
            <Tag className="w-4 h-4 mr-2" />
            Nhãn
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onDatesClick}
          >
            <Clock className="w-4 h-4 mr-2" />
            Ngày
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onAttachmentClick}
            disabled
            title="Sắp có"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Tệp đính kèm
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onCoverClick}
            disabled
            title="Sắp có"
          >
            <Image className="w-4 h-4 mr-2" />
            Ảnh bìa
          </Button>
        </div>
      </div>

      <Separator />

      {/* Actions section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Thao tác</p>

        <div className="space-y-1">
          <Button
             variant={isTemplate ? "secondary" : "ghost"}
             size="sm"
             className="w-full justify-start"
             onClick={onMakeTemplateClick}
          >
            <LayoutTemplate className="w-4 h-4 mr-2" />
            {isTemplate ? "Mẫu" : "Lưu làm mẫu"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onMoveClick}
            disabled
            title="Sắp có"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Chuyển
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onCopyClick}
            disabled
            title="Sắp có"
          >
            <Copy className="w-4 h-4 mr-2" />
            Sao chép
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={onArchiveClick}
            disabled
            title="Sắp có"
          >
            <Archive className="w-4 h-4 mr-2" />
            Lưu trữ
          </Button>

          <Separator className="my-2" />

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDeleteClick}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xoá
          </Button>
        </div>
      </div>
    </div>
  );
}
