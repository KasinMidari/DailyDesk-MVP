/**
 * Dấu hiệu của DailyDesk: một cuốn sổ nhìn nghiêng — gáy bên trái, đường lề đỏ,
 * hai dòng kẻ và một ô đã tick.
 *
 * Vẽ bằng SVG theo đúng token màu của app, không phải ảnh clip-art: mỗi nét ở
 * đây là một thứ có thật trong sản phẩm (gáy sổ, lề đỏ, ô trạng thái), nên cái
 * dấu nói được tên sản phẩm thay vì chỉ chiếm chỗ cạnh nó. Nó cũng tự đổi theo
 * nền sáng/tối vì dùng `currentColor` và biến CSS.
 */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Bìa sổ */}
      <rect x="3.5" y="2.5" width="17" height="19" rx="2" stroke="currentColor" strokeWidth="1.5" />
      {/* Gáy: một bậc đậm bên trái, như chỗ đóng chỉ */}
      <path d="M7.5 2.5v19" stroke="currentColor" strokeWidth="1.5" />
      {/* Đường lề đỏ, đúng thứ chạy dọc trang danh sách trong app */}
      <path d="M10 4.5v15" stroke="var(--red-ink)" strokeWidth="1" />
      {/* Hai dòng đã viết */}
      <path d="M12 9.5h5.5M12 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Một ô đã tick */}
      <path
        d="M11.9 16.6l1.1 1.1 2.3-2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
