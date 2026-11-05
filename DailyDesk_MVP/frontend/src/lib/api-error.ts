/**
 * Lỗi của backend đã dịch sang thông báo tiếng Việt cho người dùng.
 * Backend trả `{ message, fields? }` (contracts/api.md); khi có `fields`
 * thì ghép các câu theo trường vì chúng cụ thể hơn `message`.
 */
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

/** Thông báo dự phòng khi backend không nói gì. */
export function fallbackMessage(status: number) {
  if (status === 0) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
  if (status === 401) return "Bạn cần đăng nhập";
  if (status === 403) return "Không được phép làm việc này";
  if (status === 404) return "Không tìm thấy dữ liệu";
  return "Có lỗi xảy ra, vui lòng thử lại.";
}

/** Đọc body lỗi của backend thành `ApiError`. */
export async function apiErrorFrom(response: Response) {
  let body: { message?: string; fields?: Record<string, string> } = {};
  try {
    body = await response.clone().json();
  } catch {
    body = {};
  }
  const fieldMessages = body.fields ? Object.values(body.fields).filter(Boolean) : [];
  const message = fieldMessages.length
    ? fieldMessages.join(" ")
    : (body.message ?? fallbackMessage(response.status));
  return new ApiError(response.status, message, body.fields);
}
