import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Lỗi có mã HTTP và thông báo tiếng Việt cho người dùng. */
export class HttpError extends Error {
  status: ContentfulStatusCode;
  fields?: Record<string, string>;
  constructor(status: ContentfulStatusCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export const notFound = (what = "dữ liệu") => new HttpError(404, `Không tìm thấy ${what}`);

export const nowIso = () => new Date().toISOString();
