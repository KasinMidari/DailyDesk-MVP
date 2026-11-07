// hooks/use-background-picker.ts
import { imageUrlToFile } from "@/lib/utils";
import { CardCoverModeValue, type CardCoverMode } from "@/types/card";
import { useState } from "react";

export const BackgroundTypeValue = {
  COLOR: "color",
  IMAGE: "image",
} as const;

export type BackgroundType =
  (typeof BackgroundTypeValue)[keyof typeof BackgroundTypeValue];

export const useBackgroundPicker = (initialData?: {
  color?: string;
  imageUrl?: string;
  coverMode?: CardCoverMode;
}) => {
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(
    initialData?.color || !initialData?.imageUrl
      ? BackgroundTypeValue.COLOR
      : BackgroundTypeValue.IMAGE
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialData?.color || null
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Ảnh từ bộ có sẵn chỉ là một URL: lưu nguyên URL, không tải lên đâu.
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [coverMode, setCoverMode] = useState<CardCoverMode>(
    initialData?.coverMode || CardCoverModeValue.TOP
  );

  const handleFilePick = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setSelectedImageUrl(null);
    setSelectedColor(null);
    setCroppedFile(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  /** Chọn một ảnh trong bộ có sẵn. */
  const handleImageUrlPick = (url: string) => {
    setSelectedImageUrl(url);
    setImagePreview(url);
    setSelectedColor(null);
    setSelectedFile(null);
    setCroppedFile(null);
  };

  const handleColorPick = (color: string) => {
    setSelectedColor(color);
    setSelectedImageUrl(null);
    setSelectedFile(null);
    setCroppedFile(null);
    setImagePreview(null);
  };

  const handleCropComplete = async (croppedImage: string) => {
    setImagePreview(croppedImage);
    setSelectedImageUrl(null);
    setCroppedFile(await imageUrlToFile(croppedImage));
    setShowCropper(false);
    return;
  };

  const reset = () => {
    setBackgroundType(BackgroundTypeValue.COLOR);
    setSelectedColor(null);
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedImageUrl(null);
    setCroppedFile(null);
    setShowCropper(false);
  };

  return {
    backgroundType,
    setBackgroundType,
    selectedColor,
    setSelectedColor,
    imagePreview,
    setCoverMode,
    coverMode,
    selectedFile,
    selectedImageUrl,
    croppedFile,
    showCropper,
    setShowCropper,
    handleFilePick,
    handleImageUrlPick,
    handleColorPick,
    handleCropComplete,
    reset,
  };
};
