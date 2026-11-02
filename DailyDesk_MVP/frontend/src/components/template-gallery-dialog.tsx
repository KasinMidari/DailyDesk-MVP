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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TemplatePreviewDialog from "./template-preview-dialog";

interface TemplateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardHeader
                    className="pb-3"
                    style={{
                      backgroundColor: template.backgroundColor || "#0079bf",
                      backgroundImage: template.backgroundUrl
                        ? `url(${template.backgroundUrl})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: "100px",
                    }}
                  >
                    <div className="bg-black/50 backdrop-blur-sm rounded p-2">
                      <CardTitle className="text-white text-lg">
                        {template.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <CardDescription className="line-clamp-2 mb-3">
                      {template.description || "No description"}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">
                        {template.category || "other"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplateId(template.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem trước
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
