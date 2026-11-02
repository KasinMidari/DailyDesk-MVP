"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import { useTemplates } from "@/hooks/use-template";
import TemplatePreviewDialog from "./template-preview-dialog";

interface TemplateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  business: "Kinh doanh",
  engineering: "Kỹ thuật",
  marketing: "Marketing",
  design: "Thiết kế",
  education: "Học tập",
  personal: "Cá nhân",
  other: "Khác",
};

export default function TemplateGalleryDialog({
  open,
  onOpenChange,
}: TemplateGalleryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  const templates = useTemplates(category === "all" ? undefined : category);

  const filteredTemplates = templates.filter((template: any) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Thư viện mẫu</DialogTitle>
          </DialogHeader>

          {/* Search and Filter */}
          <div className="flex gap-4 py-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mẫu…"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="business">Kinh doanh</SelectItem>
                <SelectItem value="engineering">Kỹ thuật</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="design">Thiết kế</SelectItem>
                <SelectItem value="education">Học tập</SelectItem>
                <SelectItem value="personal">Cá nhân</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template: any) => (
                <button
                  key={template.id}
                  type="button"
                  className="group block text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <span
                    aria-hidden="true"
                    className="ml-4 block h-2.5 w-16 rounded-t-md"
                    style={{ backgroundColor: template.backgroundColor || "var(--primary)" }}
                  />
                  <span className="flex min-h-32 flex-col rounded-xl border bg-card px-4 py-3.5 transition-[border-color,box-shadow] group-hover:border-ring/60 group-hover:shadow-[0_6px_18px_-10px_rgb(15_23_42/0.25)]">
                    <span className="text-[15px] font-semibold leading-snug">{template.name}</span>
                    <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {template.description || "Chưa có mô tả"}
                    </span>
                    <span className="mt-auto flex items-center justify-between pt-3 text-[13px] text-muted-foreground">
                      <span>
                        {CATEGORY_LABEL[template.category ?? "other"] ?? "Khác"} · {template.lists?.length ?? 0} danh sách
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:underline">
                        <Eye className="size-4" aria-hidden="true" />
                        Xem trước
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy mẫu</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      {selectedTemplateId && (
        <TemplatePreviewDialog
          templateId={selectedTemplateId}
          open={!!selectedTemplateId}
          onOpenChange={(open) => !open && setSelectedTemplateId(null)}
          onClose={() => setSelectedTemplateId(null)}
        />
      )}
    </>
  );
}
