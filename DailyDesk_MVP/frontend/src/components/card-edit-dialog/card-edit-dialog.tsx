import { SHOW_ATTACHMENTS, SHOW_CARD_TEMPLATES, SHOW_COVER_UPLOAD } from "@/lib/features";
import { formatDue } from "@/lib/date";
import { SHOW_COLLABORATION } from "@/lib/features";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import type { Card } from "@/types/card";
import { CardCoverModeValue } from "@/types/card";
import { X, Tag, UserPlus, Paperclip, Clock, Wallpaper, Loader2, FileIcon, ExternalLink, Download, ChevronDown, Repeat, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader } from "./card-header";
import { CardDescription } from "./card-description";
import { CardMembers } from "./card-members";
import { CardComments } from "./card-comments";
import { CardLabels } from "./card-labels";
import { CardDates } from "./card-dates";
import { CardField, CardPriorityField, CardStatusField } from "./card-fields";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  request,
  statusFromList,
  STATUS_LABEL,
  type Priority,
  type Status,
} from "@/features/tasks/api";
import { useUpdateCard, useCreateCard } from "@/hooks/use-card";
import { useAddComment } from "@/hooks/use-comments";
import { BackgroundPickerProvider } from "@/components/background-picker-provider";
import { CardCoverPicker } from "@/components/card-edit-dialog/card-cover-picker";
import { useUploadImage, useDeleteImage } from "@/hooks/use-image";
import { useBackgroundPickerContext } from "@/components/background-picker-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { queryClient } from "@/lib/query-client";
import CheckList from "../check-list";
import { useUploadAttachment, useCreateAttachmentLink, useDeleteAttachment } from "@/hooks/use-attachment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Label as CardLabel, Member, Attachment } from "@/types/card";


// ... existing imports ...

// Inside InnerDialog
interface CardEditDialogProps {
  card?: Card | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Card) => void;
  onDelete?: (cardId: string) => void;
  layout?: "horizontal" | "vertical";
  hideCommentsActivity?: boolean;
  // Props for create mode
  listId?: string;
  order?: number;
  onCreated?: (card: Card) => void;
  defaultIsTemplate?: boolean;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
}

export function CardEditDialog({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
  listId,
  order,
  onCreated,
  defaultIsTemplate,
  ownerInfo,
  layout = "horizontal",
  hideCommentsActivity = false,
}: CardEditDialogProps) {
  const { uploadImage } = useUploadImage();

  const isCreateMode = !card;

  const handleUploadImage = async (options: {
    file: File;
    type: "card" | "board";
    id: string;
  }): Promise<string> => {
    const result = await uploadImage(options);
    return result.secure_url || "";
  };

  // Thẻ tạm cho chế độ tạo mới. Phải ổn định giữa các lần render, vì hộp thoại
  // so bản nháp với nó để biết trường nào đã đổi. Task mới không có hạn chót.
  const emptyCard: Card = useMemo(
    () => ({
      id: "",
      title: "",
      description: "",
      listId: listId || "",
      position: order || 0,
      order: order || 0,
      labels: [],
      members: [],
      coverUrl: "",
      coverColor: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemplate: defaultIsTemplate,
    }),
    [listId, order, defaultIsTemplate],
  );
  const tempCard: Card = card || emptyCard;

  return (
    <BackgroundPickerProvider
      initialData={{
        color: card?.coverColor,
        imageUrl: card?.coverUrl || undefined,
        coverMode: card?.coverMode,
      }}
    >
      <InnerDialog
        card={tempCard}
        boardId={boardId}
        isOpen={isOpen}
        onClose={onClose}
        onUpdate={onUpdate}
        uploadImage={handleUploadImage}
        isCreateMode={isCreateMode}
        listId={listId}
        order={order}
        onCreated={onCreated}
        ownerInfo={ownerInfo}
        layout={layout}
        hideCommentsActivity={hideCommentsActivity}
      />
    </BackgroundPickerProvider>
  );
}

/* ================= INNER ================= */
type ListRow = { id: string; name: string; order: number };
type FieldErrors = { title?: string; description?: string; dueAt?: string };

/** Thẻ từ backend trả về `name`, kiểu frontend dùng `title`. */
function cardTitleOf(card: Card): string {
  return card.title || (card as unknown as { name?: string }).name || "";
}

function timeOf(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

interface InnerDialogProps {
  card: Card;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (card: Card) => void;
  uploadImage: (options: {
    file: File;
    type: "card" | "board";
    id: string;
  }) => Promise<string>;
  // Create mode props
  isCreateMode?: boolean;
  listId?: string;
  order?: number;
  onCreated?: (card: Card) => void;
  ownerInfo?: { userId: string; name: string; email: string; avatar?: string | null };
  layout?: "horizontal" | "vertical";
  hideCommentsActivity?: boolean;
}

function InnerDialog({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdate,
  uploadImage,
  isCreateMode,
  listId,
  order,
  onCreated,
  ownerInfo,
  layout = "horizontal",
  hideCommentsActivity = false,
}: InnerDialogProps) {
  const isVertical = layout === "vertical";
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isMemberPopoverOpen, setIsMemberPopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isAttachmentPopoverOpen, setIsAttachmentPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const attachmentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showActivities, setShowActivities] = useState(true); // For comments/activities toggle

  // Bản nháp các trường của form: tiêu đề, mô tả, ngày, ưu tiên, trạng thái.
  // Chúng chỉ được gửi lên backend khi bấm Lưu (spec 001 §46, §79).
  // Nhận cả 'title' (kiểu frontend) và 'name' (phản hồi backend).
  const [title, setTitle] = useState(cardTitleOf(card));
  const [description, setDescription] = useState(card.description || "");
  const [labels, setLabels] = useState<CardLabel[]>(card.labels || []);
  const [members, setMembers] = useState<Member[]>(card.members || []);

  // Date and Reminder State
  const [startDate, setStartDate] = useState<Date | undefined>(
    card.startDate ? new Date(card.startDate) : undefined
  );
  const [dueAt, setDueAt] = useState<Date | undefined>(
    card.dueAt ? new Date(card.dueAt) : (card.dueDate ? new Date(card.dueDate) : undefined)
  );
  const [dueComplete, setDueComplete] = useState(card.dueComplete || false);
  const [completed, setCompleted] = useState(card.completed || false);
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(card.reminderMinutes || null);
  const [repeatFrequency, setRepeatFrequency] = useState<"daily" | "weekly" | "monthly" | null>(card.repeatFrequency || null);
  const [repeatInterval, setRepeatInterval] = useState<number | null>(card.repeatInterval || null);
  // `null` = người dùng chưa chỉnh, giá trị hiển thị lấy theo dữ liệu đã tải.
  const [priorityPick, setPriorityPick] = useState<Priority | null>(null);
  const [statusPick, setStatusPick] = useState<Status | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSavingFields, setIsSavingFields] = useState(false);

  const [isTemplate, setIsTemplate] = useState(card.isTemplate || false);
  const [isCreating, setIsCreating] = useState(false);

  // Pending items for create mode
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [pendingComments, setPendingComments] = useState<string[]>([]);
  const { mutateAsync: addCommentAsync } = useAddComment();
  const { mutate: updateCard } = useUpdateCard();
  const { mutate: createCard, isPending: isCreatePending } = useCreateCard();
  const { deleteImage } = useDeleteImage();
  const uploadAttachmentMutation = useUploadAttachment();
  const createLinkMutation = useCreateAttachmentLink();
  const deleteAttachmentMutation = useDeleteAttachment();
  const { getBackgroundData, selectedColor, selectedFile, croppedFile, reset: resetBackground } = useBackgroundPickerContext();

  const imageFile = croppedFile || selectedFile;

  const formatDueDateVN = (date: Date | string): string => formatDue(date);

  /* ---------- TRẠNG THÁI + ĐỘ ƯU TIÊN ĐÃ LƯU ---------- */
  // Trạng thái của thẻ nằm ở tên danh sách, nên cần cả danh sách của board.
  const metaEnabled = !!boardId && !!card.id && !isCreateMode && isOpen;
  const lists = useQuery({
    queryKey: ["board-lists", boardId],
    queryFn: () => request<ListRow[]>("GET", `/boards/${boardId}/lists`),
    enabled: metaEnabled,
  });
  const detail = useQuery({
    queryKey: ["card-detail", boardId, card.id],
    queryFn: () =>
      request<{ priority?: Priority | null; listId: string }>(
        "GET",
        `/boards/${boardId}/cards/${card.id}`,
      ),
    enabled: metaEnabled,
  });
  const savedPriority: Priority =
    detail.data?.priority ??
    (card as unknown as { priority?: Priority | null }).priority ??
    "medium";
  const savedList = lists.data?.find((l) => l.id === (detail.data?.listId ?? card.listId));
  const savedStatus: Status = savedList ? statusFromList(savedList.name) : "todo";
  const priority = priorityPick ?? savedPriority;
  const status = statusPick ?? savedStatus;
  const isMetaLoading = metaEnabled && (lists.isPending || detail.isPending);

  /* ---------- BẢN NHÁP: nạp lại mỗi lần mở một thẻ ---------- */
  useEffect(() => {
    if (!isOpen) return;
    setTitle(cardTitleOf(card));
    setDescription(card.description || "");
    setStartDate(card.startDate ? new Date(card.startDate) : undefined);
    setDueAt(
      card.dueAt ? new Date(card.dueAt) : card.dueDate ? new Date(card.dueDate) : undefined,
    );
    setDueComplete(card.dueComplete || false);
    setCompleted(card.completed || false);
    setReminderMinutes(card.reminderMinutes ?? null);
    setRepeatFrequency(card.repeatFrequency ?? null);
    setRepeatInterval(card.repeatInterval ?? null);
    setIsTemplate(card.isTemplate || false);
    setPriorityPick(null);
    setStatusPick(null);
    setErrors({});
    // Chỉ nạp khi mở hoặc đổi thẻ; sau đó bản nháp là của người dùng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, card.id]);


  /* ---------- PREVIEW IMAGE ---------- */
  const previewImageUrl = useMemo(() => {
    // If user selected a color, don't show image
    if (selectedColor) return null;
    // If user selected an image file, show it
    if (imageFile) return URL.createObjectURL(imageFile);
    // Otherwise show the current card cover image
    if (card.coverUrl) return card.coverUrl;
    return null;
  }, [imageFile, card.coverUrl, selectedColor]);

  useEffect(() => {
    return () => {
      if (previewImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const previewColor = useMemo(() => {
    // If user selected an image, don't show color
    if (imageFile) return null;
    // If user selected a color, show it
    if (selectedColor) return selectedColor;
    // Otherwise show the current card cover color (only if no image)
    if (!card.coverUrl && card.coverColor) return card.coverColor;
    return null;
  }, [imageFile, selectedColor, card.coverUrl, card.coverColor]);

  // Create a local card state for the UI (used in both modes)
  const localCard: Card = useMemo(() => {
    // Convert pending attachments to Attachment objects for preview
    const previewAttachments: Attachment[] = isCreateMode 
      ? pendingAttachments.map((file, index) => ({
          id: `pending-${index}`,
          name: file.name,
          url: URL.createObjectURL(file), // Create temporary URL for preview
          type: file.type,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: "me", // Placeholder
        }))
      : [];
    
    // Combine existing (if any) and pending attachments
    const displayedAttachments = isCreateMode 
      ? [...(card.attachments || []), ...previewAttachments] 
      : card.attachments;

    // Các trường của form lấy từ bản nháp ở cả hai chế độ; nhãn, thành viên và
    // ảnh bìa vẫn lấy từ thẻ thật vì chúng tự lưu ngay khi thao tác.
    return {
      ...card,
      title,
      description,
      labels: isCreateMode ? labels : card.labels,
      members: isCreateMode ? members : card.members,
      dueDate: dueAt,
      startDate,
      dueAt,
      dueComplete,
      completed,
      reminderMinutes,
      repeatFrequency,
      repeatInterval,
      isTemplate: isCreateMode ? isTemplate : card.isTemplate,
      attachments: displayedAttachments,
    };
  }, [card, isCreateMode, title, description, labels, members, dueAt, startDate, dueComplete, completed, reminderMinutes, repeatFrequency, repeatInterval, isTemplate, pendingAttachments]);

  /**
   * Một hộp thoại, hai loại thay đổi:
   * - Trường của form (tiêu đề, mô tả, ngày, ưu tiên, trạng thái) chỉ ghi vào
   *   bản nháp, chờ nút Lưu — đúng mô hình của form task ở "Việc của tôi".
   * - Thao tác trên đối tượng riêng (nhãn, thành viên, ảnh bìa, mẫu) là một
   *   hành động hoàn chỉnh, nên vẫn tự lưu ngay.
   */
  const handleUpdate = useCallback(
    (updates: Partial<Card>) => {
      // 1. Phần thuộc bản nháp.
      if (updates.title !== undefined) setTitle(updates.title);
      if (updates.description !== undefined) setDescription(updates.description || "");
      if (updates.startDate !== undefined) {
        setStartDate(updates.startDate ? new Date(updates.startDate) : undefined);
      }
      if (updates.dueAt !== undefined) {
        setDueAt(updates.dueAt ? new Date(updates.dueAt) : undefined);
      } else if (updates.dueDate !== undefined) {
        // Tương thích: vài chỗ còn gửi `dueDate`.
        setDueAt(updates.dueDate ? new Date(updates.dueDate) : undefined);
      }
      if (updates.reminderMinutes !== undefined) setReminderMinutes(updates.reminderMinutes);
      if (updates.repeatFrequency !== undefined) setRepeatFrequency(updates.repeatFrequency);
      if (updates.repeatInterval !== undefined) setRepeatInterval(updates.repeatInterval);
      // Ô tick "đã xong" và trạng thái là một thứ: tick = Xong, bỏ tick = Cần làm.
      // Chỉ khi đó là thao tác tick riêng, không phải khi đang sửa cả nhóm ngày.
      const done = updates.dueComplete ?? updates.completed;
      if (done !== undefined) {
        setDueComplete(done);
        setCompleted(done);
        const isDoneToggle = updates.dueAt === undefined && updates.startDate === undefined;
        if (isDoneToggle) setStatusPick(done ? "done" : "todo");
      }

      // 2. Phần tự lưu ngay.
      const live: Partial<Card> = {};
      if (updates.labels !== undefined) live.labels = updates.labels;
      if (updates.members !== undefined) live.members = updates.members;
      if (updates.coverColor !== undefined) live.coverColor = updates.coverColor;
      if (updates.coverUrl !== undefined) live.coverUrl = updates.coverUrl;
      if (updates.isTemplate !== undefined) live.isTemplate = updates.isTemplate;
      if (Object.keys(live).length === 0) return;

      if (isCreateMode) {
        if (live.labels !== undefined) setLabels(live.labels || []);
        if (live.members !== undefined) setMembers(live.members || []);
        if (live.isTemplate !== undefined) setIsTemplate(!!live.isTemplate);
        return;
      }

      onUpdate?.({ ...card, ...live });
      if (boardId) {
        updateCard({ boardId, cardId: card.id, ...live });
      }
    },
    [card, boardId, onUpdate, updateCard, isCreateMode]
  );

  const savedDueTime = timeOf(card.dueAt ?? card.dueDate);
  const datesChanged =
    timeOf(startDate) !== timeOf(card.startDate) ||
    timeOf(dueAt) !== savedDueTime ||
    (reminderMinutes ?? null) !== (card.reminderMinutes ?? null) ||
    (repeatFrequency ?? null) !== (card.repeatFrequency ?? null) ||
    (repeatInterval ?? null) !== (card.repeatInterval ?? null);

  /** Cùng bộ câu báo lỗi với form task ở "Việc của tôi" (`features/tasks/logic.ts`). */
  const validateDraft = (): FieldErrors => {
    const found: FieldErrors = {};
    const name = title.trim();
    if (!name) found.title = "Hãy nhập tiêu đề cho task.";
    else if (name.length > 200) found.title = "Tiêu đề tối đa 200 ký tự.";
    if (description.length > 2000) found.description = "Mô tả tối đa 2000 ký tự.";
    if (startDate && dueAt && startDate.getTime() > dueAt.getTime()) {
      found.dueAt = "Ngày bắt đầu không được sau hạn chót.";
    } else if (dueAt && timeOf(dueAt) !== savedDueTime && dueAt.getTime() < Date.now()) {
      // Chỉ chặn hạn quá khứ khi người dùng vừa đổi hạn (spec 001 §79.2).
      found.dueAt = "Hạn chót phải từ bây giờ trở đi.";
    }
    return found;
  };

  /** Tìm (hoặc tạo) danh sách ứng với trạng thái — trạng thái của thẻ là tên list. */
  const listIdForStatus = async (next: Status): Promise<string> => {
    const sorted = [...(lists.data ?? [])].sort((a, b) => a.order - b.order);
    const found = sorted.find((l) => statusFromList(l.name) === next);
    if (found) return found.id;
    const created = await request<ListRow>("POST", `/boards/${boardId}/lists`, {
      id: crypto.randomUUID(),
      name: STATUS_LABEL[next],
      order: sorted.length,
    });
    return created.id;
  };

  /** Lưu cả năm trường trong một request; ngày đi cùng vì backend nhận chung. */
  const handleSaveChanges = async () => {
    const found = validateDraft();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!boardId || !card.id) return;

    const isDone = status === "done";
    setIsSavingFields(true);
    try {
      const body: Record<string, unknown> = {
        name: title.trim(),
        description: description.trim() || null,
        priority,
        completed: isDone,
        dueComplete: isDone,
      };
      if (status !== savedStatus) body.listId = await listIdForStatus(status);
      if (datesChanged) {
        body.dueAt = dueAt ? dueAt.toISOString() : null;
        body.deadline = dueAt ? dueAt.toISOString() : null;
        body.startDate = startDate ? startDate.toISOString() : null;
        body.reminderMinutes = reminderMinutes;
        body.repeatFrequency = repeatFrequency;
        body.repeatInterval = repeatInterval;
      }

      await request("PUT", `/boards/${boardId}/cards/${card.id}`, body);

      onUpdate?.({
        ...card,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate,
        dueAt,
        dueDate: dueAt,
        dueComplete: isDone,
        completed: isDone,
        reminderMinutes,
        repeatFrequency,
        repeatInterval,
      });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      queryClient.invalidateQueries({ queryKey: ["card-detail", boardId, card.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Đã lưu thay đổi");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được thay đổi");
    } finally {
      setIsSavingFields(false);
    }
  };

  const handleCreateCard = async () => {
    if (!listId) return;

    const found = validateDraft();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsCreating(true);

    const cardName = title.trim();

    try {
      // Get background data first
      const { color: coverColor, imageFile: currentImageFile } = getBackgroundData();
      
      // Create the card first
      createCard(
        {
          boardId,
          listId,
          name: cardName,
          order: order || 0,
          description: localCard.description || undefined,
          labels: localCard.labels && localCard.labels.length > 0 ? localCard.labels : undefined,
          members: localCard.members && localCard.members.length > 0 ? localCard.members : undefined,
          
          // Date fields
          deadline: localCard.dueAt ? new Date(localCard.dueAt) : undefined,
          startDate: localCard.startDate ? new Date(localCard.startDate).toISOString() : undefined,
          dueAt: localCard.dueAt ? new Date(localCard.dueAt).toISOString() : undefined,
          dueComplete: localCard.dueComplete,
          reminderMinutes: localCard.reminderMinutes,
          repeatFrequency: localCard.repeatFrequency,
          repeatInterval: localCard.repeatInterval,

          // Set cover color if provided (image covers are uploaded separately)
          coverColor: (!currentImageFile && coverColor) ? coverColor : undefined,
          isTemplate: localCard.isTemplate,
        },
        {
          onSuccess: async (newCard) => {
            if (!newCard) return;

            // If there's a cover image, upload it
            if (currentImageFile && newCard.id) {
              try {
                await uploadImage({
                  file: currentImageFile,
                  type: "card",
                  id: newCard.id,
                });
              } catch (error) {
                console.error("Error uploading card cover:", error);
              }
            }
            
            // Handle pending items in parallel
            const promises = [];

            // 1. Upload pending attachments
            if (pendingAttachments.length > 0) {
              const attachmentPromises = pendingAttachments.map(file => 
                uploadAttachmentMutation.mutateAsync({
                  file,
                  boardId,
                  cardId: newCard.id,
                })
              );
              promises.push(...attachmentPromises);
            }

            try {
              // Wait for attachments first
              await Promise.all(promises);

              // 2. Add pending comments sequentially
              if (pendingComments.length > 0) {
                for (const content of pendingComments) {
                   await addCommentAsync({
                      boardId,
                      cardId: newCard.id,
                      content
                   });
                }
              }
            } catch (error) {
               console.error("Error processing pending items:", error);
            }

            // Invalidate to refetch with the new cover (for both color and image covers)
            queryClient.invalidateQueries({ queryKey: ["board", boardId] });

            // Reset form and close
            resetForm();
            onCreated?.(newCard as any);
            onClose();
          },
          onError: () => {
            setIsCreating(false);
          },
        }
      );
    } catch (error) {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLabels([]);
    setMembers([]);

    // Reset dates
    setStartDate(undefined);
    setDueAt(undefined); // Task mới không có hạn chót
    setDueComplete(false);
    setCompleted(false);
    setReminderMinutes(null);
    setRepeatFrequency(null);
    setRepeatInterval(null);
    setPriorityPick(null);
    setStatusPick(null);
    setErrors({});

    setIsCreating(false);
    resetBackground();
    setPendingAttachments([]);
    setPendingComments([]);
  };

  const handleUpdateCover = async () => {
    const { color: currentColor, imageFile: currentImageFile } = getBackgroundData();

    if (!currentColor && !currentImageFile) {
      return;
    }

    try {
      if (currentImageFile) {
        // Create a temporary preview URL for optimistic update
        const tempPreviewUrl = URL.createObjectURL(currentImageFile);

        // Optimistically update the card with the preview URL immediately
        onUpdate?.({ ...card, coverUrl: tempPreviewUrl, coverColor: "" });

        // Upload the image in the background
        await uploadImage({
          file: currentImageFile,
          type: "card",
          id: card.id,
        });

        // Invalidate board query to get the real URL from the server
        queryClient.invalidateQueries({
          queryKey: ["board", boardId],
        });
      } else if (currentColor) {
        // Update local state and sync with backend
        // Clear coverUrl to null when setting color
        handleUpdate({ coverColor: currentColor, coverUrl: null });
      }
      
      // Reset background context after successful save to prevent duplicate updates
      resetBackground();
    } catch (error) {
      console.error("Error updating card cover:", error);
    }
  };

  const handleRemoveCover = async () => {
    // Optimistically update the card to remove cover immediately
    onUpdate?.({ ...card, coverColor: "", coverUrl: "", coverMode: CardCoverModeValue.NONE });

    // If the card has an existing image cover, delete it from the storage in background
    if (card.coverUrl) {
      try {
        await deleteImage("card", card.id);
        // Invalidate board query to refetch the updated data
        queryClient.invalidateQueries({
          queryKey: ["board", boardId],
        });
      } catch (error) {
        console.error("Error deleting card cover image:", error);
      }
    }
  };

  const handleAddAttachment = async (file: File) => {
    if (isCreateMode) {
      setPendingAttachments(prev => [...prev, file]);
      return;
    }
    if (boardId) {
      const newAttachment = await uploadAttachmentMutation.mutateAsync({
        file,
        boardId,
        cardId: card.id,
      });

      // Update local card state with new attachment
      if (newAttachment) {
        const updatedAttachments = [...(card.attachments || []), newAttachment];
        onUpdate?.({ ...card, attachments: updatedAttachments });
      }
    }
  };

  const handleAddLink = async () => {
    if (linkUrl.trim() && boardId) {
      const newAttachment = await createLinkMutation.mutateAsync({
        boardId,
        cardId: card.id,
        name: linkName.trim() || linkUrl.trim(),
        url: linkUrl.trim(),
        type: "link",
        size: 0,
      });

      // Update local card state with new attachment
      if (newAttachment) {
        const updatedAttachments = [...(card.attachments || []), newAttachment];
        onUpdate?.({ ...card, attachments: updatedAttachments });
      }

      setLinkUrl("");
      setLinkName("");
      setIsAttachmentPopoverOpen(false);
    }
  };

  const handleAttachmentFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleAddAttachment(file);
      event.target.value = "";
      setIsAttachmentPopoverOpen(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (boardId) {
      await deleteAttachmentMutation.mutateAsync({
        boardId,
        cardId: card.id,
        attachmentId,
      });

      // Update local card state by removing the attachment
      const updatedAttachments = (card.attachments || []).filter(
        (att) => att.id !== attachmentId
      );
      onUpdate?.({ ...card, attachments: updatedAttachments });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (url: string, type?: string): boolean => {
    if (type?.startsWith("image/")) return true;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  const getFileName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split("/").pop() || url;
    } catch {
      return url;
    }
  };

  const handleClose = async () => {
    if (isCreateMode) {
      // In create mode, just reset form and close
      resetForm();
      onClose();
      return;
    }

    // Get latest background data before closing
    const { color: latestColor, imageFile: latestImageFile } = getBackgroundData();

    if (latestImageFile || latestColor) {
      setIsUploading(true);
      try {
        await handleUpdateCover();
      } finally {
        setIsUploading(false);
      }
    }
    // Close the dialog after save completes
    onClose();
  };

  const isSubmitting = isCreatePending || isCreating;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="!flex !flex-col !p-0 !gap-0"
        style={{
          // Cao theo nội dung, chỉ chặn trên: hộp thoại ít nội dung không để lại lỗ trống.
          maxWidth: isVertical ? '920px' : '1200px',
          width: 'calc(100vw - 2rem)',
          height: 'auto',
          maxHeight: isVertical ? 'min(85svh, 760px)' : 'min(640px, 90svh)',
        }}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Sửa task</DialogTitle>
          <DialogDescription>
            Sửa chi tiết, nhãn và ảnh bìa của task
          </DialogDescription>
        </VisuallyHidden>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang cập nhật task…</p>
            </div>
          </div>
        )}
        {/* Top-right action buttons */}
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {/* Edit cover button */}
          {SHOW_COVER_UPLOAD && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đổi ảnh bìa"
              title="Đổi ảnh bìa"
              onClick={() => setIsCoverPickerOpen(true)}
            >
              <Wallpaper className="h-4 w-4" />
            </Button>
          )}

          {/* Close button */}
          <Button variant="ghost" size="icon" aria-label="Đóng" title="Đóng" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cover preview */}
        {(previewImageUrl || previewColor) && (
          <div
            className="relative w-full h-40 shrink-0 group"
            style={{
              backgroundImage: previewImageUrl
                ? `url(${previewImageUrl})`
                : undefined,
              backgroundColor: previewColor ?? undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        )}
        {/* Main content area - Horizontal flex layout */}
        <div className={`flex ${isVertical ? "flex-col" : "flex-row"} min-h-0 flex-1 w-full overflow-hidden`}>
          {/* Left column - Main content */}
          <div
            className="flex-1 space-y-6 p-6 overflow-y-auto max-h-full overscroll-contain"
            style={{
              minWidth: isVertical ? "auto" : "min(500px, 100%)",
              touchAction: 'auto',
              WebkitOverflowScrolling: 'touch'
            } as React.CSSProperties}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Tiêu đề */}
            <CardHeader card={localCard} onUpdate={handleUpdate} error={errors.title} />

            {/* Mô tả */}
            <CardDescription card={localCard} onUpdate={handleUpdate} error={errors.description} />

            {/* Hạn chót */}
            <CardField label="Hạn chót" error={errors.dueAt}>
              <div className="flex flex-wrap gap-2">
                <CardDates
                  card={localCard}
                  boardId={boardId}
                  onUpdate={handleUpdate}
                  isOpen={isDatePopoverOpen}
                  onOpenChange={setIsDatePopoverOpen}
                  // Lịch chỉ ghi vào bản nháp; cả hộp thoại dùng một nút Lưu.
                  createMode
                  triggerButton={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-invalid={!!errors.dueAt}
                      className="h-8 px-3 flex items-center gap-2"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {localCard.dueAt ? (
                        <span className="text-sm tabular">{formatDueDateVN(localCard.dueAt)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Chọn ngày</span>
                      )}
                      {localCard.repeatFrequency && <Repeat className="h-3.5 w-3.5 opacity-70" />}
                      <ChevronDown className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  }
                />
                {localCard.startDate && (
                  <span className="self-center text-sm tabular text-muted-foreground">
                    Bắt đầu {formatDueDateVN(localCard.startDate)}
                  </span>
                )}
              </div>
            </CardField>

            {/* Độ ưu tiên + Trạng thái: chỉ sửa được khi thẻ đã có trên backend */}
            {!isCreateMode && localCard.id && boardId && (
              isMetaLoading ? (
                <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
                  {["Độ ưu tiên", "Trạng thái"].map((label) => (
                    <div key={label} className="grid gap-1.5">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="h-10 rounded-md bg-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <CardPriorityField value={priority} onChange={setPriorityPick} />
                  <CardStatusField
                    value={status}
                    onChange={(next) => {
                      // Trạng thái và ô tick "đã xong" là một thứ.
                      setStatusPick(next);
                      setDueComplete(next === "done");
                      setCompleted(next === "done");
                    }}
                  />
                </div>
              )
            )}

            {/* Action buttons row */}
            <div className="flex flex-wrap gap-2">
              <CardLabels
                card={localCard}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isLabelPopoverOpen}
                onOpenChange={setIsLabelPopoverOpen}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <Tag className="h-4 w-4 mr-1" />
                    Nhãn {card.labels && isCreateMode && card.labels.length > 0 && `(${card.labels.length})`}
                  </Button>
                }
              />
              {SHOW_COLLABORATION && <CardMembers
                card={localCard}
                onUpdate={handleUpdate}
                boardId={boardId || ""}
                isOpen={isMemberPopoverOpen}
                onOpenChange={setIsMemberPopoverOpen}
                ownerInfo={ownerInfo}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Thành viên {card.members && isCreateMode && card.members.length > 0 && `(${card.members.length})`}
                  </Button>
                }
              />}
              {SHOW_ATTACHMENTS && (
              <Popover open={isAttachmentPopoverOpen} onOpenChange={setIsAttachmentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Paperclip className="h-4 w-4 mr-1" />
                    Đính kèm {localCard.attachments && localCard.attachments.length > 0 && `(${localCard.attachments.length})`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Đính kèm</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => attachmentFileInputRef.current?.click()}
                          disabled={uploadAttachmentMutation.isPending}
                        >
                          {uploadAttachmentMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang tải lên…
                            </>
                          ) : (
                            <>
                              <Paperclip className="h-4 w-4 mr-2" />
                              Máy tính
                            </>
                          )}
                        </Button>
                        <input
                          ref={attachmentFileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleAttachmentFileChange}
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <Label htmlFor="attach-link-url" className="text-xs">
                          Hoặc đính kèm link
                        </Label>
                        <Input
                          id="attach-link-url"
                          placeholder="Dán link…"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddLink();
                          }}
                        />
                        <Input
                          placeholder="Tên link (không bắt buộc)"
                          value={linkName}
                          onChange={(e) => setLinkName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddLink();
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAttachmentPopoverOpen(false);
                              setLinkUrl("");
                              setLinkName("");
                            }}
                          >
                            Huỷ
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddLink}
                            disabled={!linkUrl.trim() || createLinkMutation.isPending}
                          >
                            {createLinkMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Đang đính kèm…
                              </>
                            ) : (
                              "Đính kèm"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              )}

              {/* Template Toggle */}
              {SHOW_CARD_TEMPLATES && (
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={!!localCard.isTemplate}
                  className={`h-8 ${localCard.isTemplate ? "bg-accent" : ""}`}
                  onClick={() => handleUpdate({ isTemplate: !localCard.isTemplate })}
                >
                  <LayoutTemplate className="h-4 w-4 mr-1" />
                  {localCard.isTemplate ? "Đang là mẫu" : "Lưu làm mẫu"}
                </Button>
              )}
            </div>

           


            {/* Labels display - only show if has labels */}
            {localCard.labels && localCard.labels.length > 0 && (
              <CardLabels card={localCard} onUpdate={handleUpdate} boardId={boardId || ""} />
            )}

            {/* Members display - only show if has members */}
            {localCard.members && localCard.members.length > 0 && (
              <CardMembers card={localCard} onUpdate={handleUpdate} boardId={boardId || ""} ownerInfo={ownerInfo} />
            )}

            {/* CheckList */}
            <CheckList card={localCard} boardId={boardId} onUpdate={handleUpdate} ownerInfo={ownerInfo} />

            {/* Attachments */}
            {localCard.attachments && localCard.attachments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Tệp đính kèm
                </h3>
                <div className="space-y-3">
                  {localCard.attachments.map((attachment) => {
                    const isImage = isImageFile(attachment.url, attachment.type);
                    const displayName = attachment.name || getFileName(attachment.url);

                    return (
                      <div key={attachment.id} className="flex gap-3 group">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="w-28 h-20 rounded border overflow-hidden bg-muted">
                              <img
                                src={attachment.url}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-28 h-20 rounded border flex items-center justify-center bg-muted">
                              <FileIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline flex items-center gap-1 truncate"
                          >
                            {displayName}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {attachment.uploadedAt && (
                              <span>
                                Thêm {new Date(attachment.uploadedAt).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {attachment.size > 0 && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(attachment.size)}</span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleRemoveAttachment(attachment.id)}
                            >
                              Xoá
                            </Button>
                            <a href={attachment.url} download={displayName}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                Tải xuống
                              </Button>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Comments and activity */}
          {!hideCommentsActivity && (
            <div
              // `self-start` để cột bình luận cao theo nội dung, không bị kéo bằng cột trái.
              className={`flex-shrink-0 self-start max-h-full overflow-y-auto overscroll-contain ${
                isVertical
                  ? "w-full border-t bg-muted/30 p-6"
                  : "w-96 border-l bg-muted/30 p-6"
              }`}
              style={{
                touchAction: 'auto',
                WebkitOverflowScrolling: 'touch'
              } as React.CSSProperties}
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Bình luận và hoạt động
                  </span>
                </div>

                {/* Comments section */}
                <CardComments
                  card={localCard}
                  boardId={boardId}
                  showActivities={showActivities}
                  onToggleActivities={() => setShowActivities(!showActivities)}
                  isCreateMode={isCreateMode}
                  pendingComments={pendingComments}
                  onAddPendingComment={(comment) => setPendingComments(prev => [...prev, comment])}
                />
              </div>
            </div>
          )}
        </div>

        {/* Một nút Lưu cho cả hộp thoại, như form task ở "Việc của tôi" */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Huỷ
          </Button>
          {isCreateMode ? (
            <Button onClick={handleCreateCard} disabled={isSubmitting} className="min-w-28">
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? "Đang tạo…" : "Tạo task"}
            </Button>
          ) : (
            <Button
              onClick={handleSaveChanges}
              disabled={isSavingFields || isMetaLoading}
              className="min-w-28"
            >
              {isSavingFields && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Lưu thay đổi
            </Button>
          )}
        </div>
        {/* Cover picker dialog */}
        {SHOW_COVER_UPLOAD && (
        <Popover
          open={isCoverPickerOpen}
          onOpenChange={async (open) => {
            if (!open) {
              const { color: latestColor, imageFile: latestImageFile } = getBackgroundData();
              if (latestColor || latestImageFile) {
                setIsUploading(true);
                try {
                  await handleUpdateCover();
                } finally {
                  setIsUploading(false);
                }
              }
            }
            setIsCoverPickerOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-12 z-20"
            >
              <Wallpaper className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            side="right"
            align="start"
            className="w-[400px] p-6 ml-2"
          >
            <CardCoverPicker card={localCard} onRemoveCover={handleRemoveCover} />
          </PopoverContent>
        </Popover>
        )}
      </DialogContent>
    </Dialog>
  );
}
