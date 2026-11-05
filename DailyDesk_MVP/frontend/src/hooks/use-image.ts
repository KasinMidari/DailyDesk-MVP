import { USE_MOCK } from "@/mocks/install";
import { SHOW_COVER_UPLOAD } from "@/lib/features";
import { queryApi } from "@/lib/api";
import { queryClient } from "@/lib/query-client";
import imageCompression from "browser-image-compression";

export type SaveImageResponseType = {
  secure_url?: string;
  public_id?: string;
};

type UploadImageInput = {
  file: File;
  type: "board" | "card";
  id: string;
};

export function useUploadConfig() {
  // Khi chạy mock, ảnh không thực sự lên Cloudinary (src/mocks/install.ts giả lập).
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || (USE_MOCK ? "mock" : undefined),
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || (USE_MOCK ? "mock" : undefined),
  };
}

export function useUploadImage() {
  const { cloudName, uploadPreset } = useUploadConfig();

  const mutation = queryApi.useMutation("post", "/media/image/{type}/{id}");

  const uploadImage = async ({ file, type, id }: UploadImageInput) => {
    // Backend thật không có `/media/image/*` (nhóm C): bỏ qua thay vì gọi rồi 404.
    if (!SHOW_COVER_UPLOAD) return undefined;
    if (!cloudName || !uploadPreset)
      throw new Error("Chưa cấu hình nơi lưu ảnh");

    let fileToUpload = file;
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });
      fileToUpload = compressedFile;
    } catch (e) {
      console.warn("Image compression failed, upload original file", e);
    }

    const folder = `schedule_management/${type}`;
    const form = new FormData();
    form.append("upload_preset", uploadPreset);
    form.append("folder", folder);
    form.append("file", fileToUpload);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: form,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const uploadData = await uploadRes.json();
    if (!uploadData.secure_url || !uploadData.public_id)
      throw new Error("Invalid Cloudinary response");

    const savedData = await mutation.mutateAsync({
      params: { path: { type, id } },
      body: {
        secure_url: uploadData.secure_url,
        public_id: uploadData.public_id,
      },
    });
    if (type === "board") {
      queryClient.invalidateQueries({ queryKey: ["board", id] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    }

    if (type === "card") {
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    }
    return savedData;
  };

  return { uploadImage };
}

export function useDeleteImage() {
  const mutation = queryApi.useMutation("delete", "/media/image/{type}/{id}");
  const deleteImage = async (type: "board" | "card", id: string) => {
    // Như trên: không có route thật thì coi như không có ảnh để xoá.
    if (!SHOW_COVER_UPLOAD) return;
    await mutation.mutateAsync({
      params: { path: { type, id } },
    });
    if (type === "board") {
      queryClient.invalidateQueries({ queryKey: ["board", id] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    }
    if (type === "card") {
      queryClient.invalidateQueries({ queryKey: ["card", id] });
    }
  };

  return { deleteImage };
}
