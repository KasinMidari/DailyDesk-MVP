import { useEffect, useId, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { Card } from "@/types/card";
import { CardField } from "./card-fields";

interface CardDescriptionProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
  /** Lỗi của trường mô tả, hiện khi bấm Lưu. */
  error?: string;
}

/** Mô tả: ô nhập luôn mở, ghi vào bản nháp; cả hộp thoại chỉ có một nút Lưu. */
export function CardDescription({ card, onUpdate, error }: CardDescriptionProps) {
  const id = useId();
  const [description, setDescription] = useState(card.description || "");

  useEffect(() => {
    setDescription(card.description || "");
  }, [card.description]);

  const push = () => {
    const next = description.trim();
    if (next !== (card.description || "")) {
      onUpdate({ description: next || undefined });
    }
  };

  return (
    <CardField
      label="Mô tả"
      htmlFor={`${id}-desc`}
      error={error}
      hint={description ? `${description.length}/2000` : "Không bắt buộc"}
    >
      <Textarea
        id={`${id}-desc`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={push}
        placeholder="Ghi chú thêm, đường link, các bước cần làm…"
        aria-invalid={!!error}
        className="min-h-24 resize-y leading-relaxed"
      />
    </CardField>
  );
}
