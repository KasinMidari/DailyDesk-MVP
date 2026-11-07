"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/components/theme-provider";

/**
 * Một kiểu thông báo duy nhất cho cả app: luôn ở góc phải dưới, luôn cùng
 * màu nền với giao diện đang bật.
 *
 * Trước đây file này đọc theme từ `next-themes` — thư viện đó không hề được
 * mount ở đâu, nên nó luôn trả về "system" và toast đi theo màu của hệ điều
 * hành chứ không theo nút sáng/tối của app. Máy đặt nền tối mà app đang nền
 * sáng thì toast hiện ra tối thui, nhìn như của ứng dụng khác.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      toastOptions={{
        classNames: {
          description: "text-muted-foreground!",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
