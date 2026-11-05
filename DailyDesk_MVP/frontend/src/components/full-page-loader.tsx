import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export default function PageLoader({
  className,
  text = "Đang mở sổ…",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full w-full flex-col items-center justify-center gap-3"
    >
      {/* Chữ ngang hàng với vòng quay, cỡ chữ thường: màn chờ không phải tiêu đề của trang. */}
      <Spinner className={cn("size-6", className)} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
