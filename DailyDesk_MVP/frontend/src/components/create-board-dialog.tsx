// create-board-dialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { BackgroundPicker } from "@/components/background-picker";
import {
  BackgroundPickerProvider,
  useBackgroundPickerContext,
} from "@/components/background-picker-provider";
import { SHOW_COVER_UPLOAD } from "@/lib/features";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (
    title: string,
    backgroundColor?: string,
    backgroundImage?: File
  ) => Promise<void>;
}

export default function CreateBoardDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateBoardDialogProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md min-h-[60vh] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <BackgroundPickerProvider>
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
              <Spinner className="size-10" />
              <p className="text-xl font-semibold">Đang tạo board…</p>
            </div>
          ) : (
            <DialogForm
              title={title}
              setTitle={setTitle}
              onCreate={onCreate}
              onClose={handleClose}
              setIsSubmitting={setIsSubmitting}
            />
          )}
        </BackgroundPickerProvider>
      </DialogContent>
    </Dialog>
  );
}

function DialogForm({
  title,
  setTitle,
  onCreate,
  onClose,
  setIsSubmitting,
}: {
  title: string;
  setTitle: (t: string) => void;
  onCreate: (title: string, color?: string, file?: File) => Promise<void>;
  onClose: () => void;
  setIsSubmitting: (v: boolean) => void;
}) {
  const { getBackgroundData, reset } = useBackgroundPickerContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const { color, imageFile } = getBackgroundData();

    if (imageFile?.type === "image/gif" && imageFile.size > 5 * 1024 * 1024) {
      alert(
        "File too large (>5MB). Please reduce the size or switch to WebP/MP4."
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    await onCreate(trimmed, color, imageFile);
    onClose();

    setTimeout(() => {
      setIsSubmitting(false);
      reset();
      setTitle("");
    }, 500);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tạo board mới</DialogTitle>
        <DialogDescription>
          Give your board a name and choose a background color or image. You can
          change both later.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="grid gap-8 ">
        <div className="grid gap-4">
          <Label htmlFor="board-title">Tên board</Label>
          <Input
            id="board-title"
            placeholder="e.g. Marketing Campaign 2025"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid gap-4">
          <Label>{SHOW_COVER_UPLOAD ? "Ảnh nền" : "Màu nền"}</Label>
          <BackgroundPicker />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            Tạo board
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
