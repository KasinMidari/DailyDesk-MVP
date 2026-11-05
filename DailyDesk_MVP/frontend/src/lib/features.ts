/**
 * Bật/tắt các tính năng ngoài phạm vi MVP.
 * Cộng tác nhóm (mời thành viên, chia sẻ board, giao task) bị ẩn
 * vì đề bài yêu cầu tránh làm việc theo nhóm. Code vẫn giữ lại.
 */
import { USE_MOCK } from "@/mocks/install";

export const SHOW_COLLABORATION = false;

/** Tạo task từ thẻ mẫu ngay trong cột: trùng chức năng với "Thêm task", nên ẩn để cột gọn. */
export const SHOW_CARD_TEMPLATES = false;

/**
 * Nhóm C của contracts/api.md: backend thật trả 404 cho `/templates*`,
 * `…/attachments*` và `/media/image/*`. Chỉ bật khi chạy backend giả
 * để bản deploy không còn nút dẫn tới route không có.
 */
export const SHOW_TEMPLATES = USE_MOCK;
export const SHOW_ATTACHMENTS = USE_MOCK;
export const SHOW_COVER_UPLOAD = USE_MOCK;

/** Backend thật không có luồng SSE `/boards/:id/sse`. */
export const SHOW_REALTIME = false;
