"use client";

import { AdvancedColorPicker } from "./color-picker";
import { cn, imageUrlToFile } from "@/lib/utils";
import React, { useState } from "react";
import { BackgroundTypeValue } from "@/hooks/use-background-picker";
import ImageCropper from "./image-cropper";
import { useBackgroundPickerContext } from "./background-picker-provider";
import { Card, CardContent } from "./ui/card";
import { SHOW_COVER_PRESETS, SHOW_COVER_UPLOAD } from "@/lib/features";

/** Ảnh nền có sẵn. Chọn một cái là lưu URL, không tải tệp nào lên. */
const PRESET_IMAGES = [
  "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610459/japan-background-digital-art_ftw16m.jpg",
  "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610458/anime-style-cozy-home-interior-with-furnishings_w64pvh.jpg",
  "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610458/anime-moon-landscape_xpl8tc.jpg",
  "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610458/japan-background-digital-art_1_v64imy.jpg",
  "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610457/japan-background-digital-art_2_t9ezt8.jpg",
  "https://res.cloudinary.com/dpqv7ag5w/image/upload/v1765610797/japan-background-digital-art_nzenvh.jpg",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&q=80",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
  "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
];

export function BackgroundPicker() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedBGIndex, setSelectedBGIndex] = useState<number | null>(null);

  const {
    backgroundType,
    setBackgroundType,
    selectedColor,
    imagePreview,
    selectedFile,
    showCropper,
    setShowCropper,
    handleFilePick,
    handleImageUrlPick,
    handleCropComplete,
    handleColorPick,
  } = useBackgroundPickerContext();

  const imageModeAvailable = SHOW_COVER_PRESETS || SHOW_COVER_UPLOAD;
  const showImageMode = imageModeAvailable && backgroundType === BackgroundTypeValue.IMAGE;

  return (
    <div className="grid gap-2">
      {SHOW_COVER_UPLOAD && (
        <ImageCropper
          open={showCropper}
          onOpenChange={setShowCropper}
          file={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}

      {/* Switcher: chỉ còn màu khi cả ảnh có sẵn và ảnh tải lên đều tắt */}
      <div className={cn("flex gap-3", !imageModeAvailable && "hidden")}>
        <button
          type="button"
          onClick={() => setBackgroundType(BackgroundTypeValue.COLOR)}
          className={cn(
            "rounded-md border px-3 py-1 text-sm",
            backgroundType === BackgroundTypeValue.COLOR
              ? "border-ring bg-accent text-accent-foreground"
              : "border-transparent text-muted-foreground hover:bg-accent/50",
          )}
        >
          Màu
        </button>

        <button
          type="button"
          onClick={() => setBackgroundType(BackgroundTypeValue.IMAGE)}
          className={cn(
            "rounded-md border px-3 py-1 text-sm",
            backgroundType === BackgroundTypeValue.IMAGE
              ? "border-ring bg-accent text-accent-foreground"
              : "border-transparent text-muted-foreground hover:bg-accent/50",
          )}
        >
          Ảnh
        </button>
      </div>

      {!showImageMode ? (
        /* CHẾ ĐỘ MÀU */
        <div className="my-4 flex w-full items-start gap-4">
          <div className="grid w-full flex-[2] gap-6">
            <AdvancedColorPicker
              className="w-full"
              color={selectedColor}
              onChange={(color) => {
                handleColorPick(color);
                setSelectedBGIndex(null);
              }}
            />
          </div>
          <div className="ml-3 flex flex-[1] items-center gap-2">
            <span className="text-sm text-muted-foreground">Xem trước</span>
            <div
              className="h-9 w-full rounded-md border"
              style={{ backgroundColor: selectedColor ?? undefined }}
            />
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ ẢNH */
        <div className="mt-2 grid gap-3">
          <div className="grid grid-cols-4 gap-2">
            {PRESET_IMAGES.map((url, index) => (
              <button
                key={url}
                type="button"
                aria-label={`Chọn ảnh nền ${index + 1}`}
                aria-pressed={selectedBGIndex === index}
                onClick={() => {
                  setSelectedBGIndex(index);
                  handleImageUrlPick(url);
                }}
                className={cn(
                  "h-14 cursor-pointer overflow-hidden rounded-md border bg-cover bg-center bg-no-repeat transition select-none",
                  selectedBGIndex === index
                    ? "border-ring ring-2 ring-ring/40"
                    : "border-transparent hover:opacity-80",
                )}
                style={{ backgroundImage: `url(${url})` }}
              />
            ))}

            {SHOW_COVER_UPLOAD && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleFilePick(e.target.files?.[0] ?? null);
                    setSelectedBGIndex(null);
                  }}
                  className="hidden"
                />
                <Card
                  className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed py-0 transition-all hover:bg-accent/40"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CardContent className="flex w-full items-center justify-center p-0 pb-1">
                    <p className="text-sm font-medium">Tuỳ chỉnh</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div
              onClick={async () => {
                if (!SHOW_COVER_UPLOAD || !imagePreview) return;
                if (!selectedFile) {
                  handleFilePick(await imageUrlToFile(imagePreview));
                }
                setShowCropper(true);
              }}
              className={cn(
                "flex h-32 w-[57%] items-center justify-center overflow-hidden rounded-md border bg-muted bg-cover bg-center",
                SHOW_COVER_UPLOAD && imagePreview && "cursor-pointer transition hover:opacity-80",
              )}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Ảnh nền đã chọn" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground select-none">Chưa chọn ảnh</span>
              )}
            </div>
            {SHOW_COVER_UPLOAD && imagePreview && (
              <p className="text-xs text-muted-foreground">Bấm vào ảnh để cắt</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
