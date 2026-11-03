# Research & Technical Decisions: 001-personal-task-management

Mỗi mục ghi: quyết định, lý do, các phương án đã cân nhắc. Đây cũng là nguồn cho `DECISIONS.md` (minh chứng DL-008).

## R1. Nền tảng backend

- **Decision**: Node.js 22 LTS + TypeScript 5, framework Hono 4 (chạy bằng `@hono/node-server`).
- **Rationale**: Nhóm đã dùng Hono ở bản cũ nên không mất thời gian học. Hono nhẹ, có sẵn middleware CORS/logger, và `app.request()` cho phép viết test API mà không cần mở cổng mạng. Cùng ngôn ngữ TypeScript với frontend nên dùng chung được quy tắc kiểm tra dữ liệu.
- **Alternatives considered**: Express (nhiều tài liệu nhưng phải tự ghép test và type); NestJS (quá nặng cho 1 tuần); Supabase làm backend luôn (nhanh nhưng mất phần "thiết kế BE" mà người dùng muốn tự làm).

## R2. Lưu trữ dữ liệu

- **Decision**: SQLite qua `@libsql/client` + Drizzle ORM. Khi chạy ở máy dùng file `./data/dailydesk.db`; khi deploy dùng Turso (SQLite có host, gói miễn phí). Schema áp bằng `drizzle-kit push` cho MVP.
- **Rationale**: Đề bài gợi ý SQLite. libsql cho cùng một đoạn code chạy được cả file cục bộ, `:memory:` (cho test) lẫn Turso. Render gói miễn phí xoá ổ đĩa mỗi lần deploy, nên không thể để file SQLite trên Render.
- **Alternatives considered**: localStorage (không đáp ứng FR-011 "dùng trình duyệt khác vẫn còn dữ liệu"); PostgreSQL trên Neon (tốt nhưng thêm một loại DB khác cho máy cục bộ); file SQLite trên Render (mất dữ liệu khi redeploy).

## R3. Đăng nhập Google và phiên làm việc

- **Decision**: Frontend dùng Google Identity Services để lấy *Google ID token*, gửi lên `POST /auth/google`. Backend kiểm tra token bằng JWKS của Google (thư viện `jose`; kiểm `iss`, `aud` = Google Client ID, `exp`, `email_verified`), tạo hoặc cập nhật người dùng, rồi trả về **token phiên của ứng dụng** (JWT HS256, hạn 7 ngày). Mọi request sau gửi `Authorization: Bearer <token>`.
  - Có thêm `POST /auth/dev` chỉ bật khi `AUTH_DEV_LOGIN=true`, cho phép đăng nhập bằng tài khoản thử nghiệm khi quay demo hoặc chạy test mà không cần Google.
- **Rationale**: Chỉ cần Google (theo spec), không phụ thuộc tenant Auth0 của nhóm cũ, không tốn phí. Token phiên riêng giúp backend không phải gọi Google mỗi request. Giao diện hiện có đã có lớp `src/lib/auth.tsx` cùng API kiểu `useAuth0`, nên chỉ cần thay phần bên trong.
- **Alternatives considered**: Auth0 (đã dùng ở bản cũ nhưng tenant không rõ của ai, cấu hình nhiều); Clerk (nhanh nhưng thêm phụ thuộc dịch vụ ngoài); kiểm tra trực tiếp Google ID token ở mọi request (token chỉ sống 1 giờ, phải làm mới phía client phức tạp hơn).

## R4. Mô hình trạng thái task

- **Decision**: Trạng thái được suy ra từ danh sách (list) chứa task: tên list `Todo` / `Doing` / `Done` (không phân biệt hoa thường, chấp nhận cả "Đang làm", "Đã xong"). Đổi trạng thái = chuyển task sang list tương ứng trong cùng board; nếu board chưa có list đó thì tạo mới. Lần đăng nhập đầu, backend tạo board mặc định "Việc của tôi" với ba list Todo/Doing/Done.
- **Rationale**: Khớp với giả định trong spec và với cả hai chế độ xem đã có (danh sách và kanban), không phải lưu trạng thái hai nơi.
- **Alternatives considered**: Cột `status` riêng trên task (đơn giản cho danh sách nhưng lệch với kanban, phải đồng bộ hai chiều).

## R5. Kiểm tra dữ liệu và định dạng lỗi

- **Decision**: Dùng `zod` cho mọi body. Quy tắc theo FR-005, FR-007: tiêu đề cắt khoảng trắng còn 1–200 ký tự; mô tả ≤ 2000; độ ưu tiên ∈ {`high`, `medium`, `low`}; hạn chót là chuỗi ISO 8601 hợp lệ và không ở quá khứ khi tạo hoặc khi giá trị hạn thay đổi. Lỗi trả `400` với `{ "message": "...", "fields": { "name": "Hãy nhập tiêu đề cho task." } }`. Thông báo bằng tiếng Việt, cùng câu chữ với frontend.
- **Rationale**: Backend là nơi kiểm tra cuối cùng; frontend vẫn kiểm tra trước để phản hồi tức thì. Dùng cùng câu chữ để người dùng không thấy hai kiểu thông báo.
- **Alternatives considered**: Chỉ kiểm tra ở frontend (không an toàn); thông báo tiếng Anh từ backend (lệch FR-019).

## R6. Tách dữ liệu giữa người dùng

- **Decision**: Middleware xác thực đặt `userId` vào context. Mọi truy vấn đều lọc theo `userId` (board.userId = me; list và card truy qua board). Tài nguyên không thuộc người gọi trả `404 { message: "Không tìm thấy" }`, không bao giờ `403`, để không lộ sự tồn tại (FR-003).
- **Rationale**: Đáp ứng trực tiếp FR-003 và SC-005; viết được test tự động với hai người dùng.
- **Alternatives considered**: Kiểm tra quyền ở từng route thủ công (dễ sót); bảng thành viên board như bản cũ (ngoài phạm vi: làm việc nhóm).

## R7. Tương thích với giao diện hiện có

- **Decision**: Backend giữ đúng đường dẫn và hình dạng JSON mà backend giả `frontend/src/mocks/server.ts` đang trả, để frontend chuyển sang dữ liệu thật chỉ bằng `VITE_USE_MOCK=false` và `VITE_BACKEND_URL`. Route được chia ba nhóm (xem `contracts/api.md`):
  - **Nhóm A, bắt buộc (P1–P2)**: auth, boards, lists, cards, `GET /boards/cards/all`.
  - **Nhóm B, nên có (P3, để hộp thoại chi tiết hoạt động đủ)**: due, checklist, labels, comments, activities/timeline, search.
  - **Nhóm C, ngoài phạm vi**: members, attachments, media, templates. Khi chạy backend thật, frontend ẩn các nút tương ứng bằng cờ trong `src/lib/features.ts`.
- **Rationale**: Không phải viết lại giao diện; chỉ làm phần backend cần cho đề bài. Cắt nhóm C giữ đúng phạm vi MVP.
- **Alternatives considered**: Thiết kế API mới gọn hơn và sửa frontend theo (tốn thời gian, rủi ro lỗi giao diện đã ổn định); làm đủ cả 53 route như bản cũ (vượt phạm vi một tuần).

## R8. Kiểm thử

- **Decision**: Vitest cho cả hai phía.
  - Backend: test tích hợp gọi `app.request()` trên SQLite `:memory:`, bao phủ CRUD, kiểm tra dữ liệu, đổi trạng thái và tách dữ liệu giữa hai người dùng.
  - Frontend: unit test cho `src/features/tasks/logic.ts` (lọc, sắp xếp, nhóm theo hạn, `validateTask`).
  - Kèm `TEST_CASES.md` thủ công có cột Pass/Fail (DL-003).
- **Rationale**: Đáp ứng tiêu chí "Kiểm thử" và là "điểm nhấn" cho mức 10 điểm. SQLite `:memory:` cho test nhanh, độc lập, không cần dọn dẹp.
- **Alternatives considered**: Jest (chậm hơn, cấu hình ESM phức tạp); Playwright E2E (tốt nhưng tốn thời gian cho một tuần, để vào "nếu có thêm thời gian").

## R9. Triển khai

- **Decision**: Frontend lên Vercel (build tĩnh của Vite). Backend lên Render (Web Service miễn phí, chạy `node dist/index.js`). Dữ liệu trên Turso. CORS chỉ cho phép domain frontend và `http://localhost:5173`.
- **Rationale**: Đều miễn phí, đúng gợi ý đề bài, có link chạy thật làm minh chứng (DL-010).
- **Rủi ro & ứng phó**: Render gói miễn phí "ngủ" sau 15 phút không dùng, request đầu chờ khoảng 30–50 giây. Ứng phó: mở link trước khi quay demo, ghi rõ trong README phần hạn chế.
- **Alternatives considered**: Fly.io (cần thẻ thanh toán); Vercel Functions cho backend (giới hạn thời gian chạy, khó dùng chung code test).

## R10. Định danh và thứ tự

- **Decision**: ID dạng UUIDv7. Chấp nhận `id` do client gửi lên khi tạo (giao diện hiện đang làm vậy), nhưng kiểm tra định dạng và trùng lặp. Thứ tự list và card dùng cột số nguyên `order`.
- **Rationale**: Giữ tương thích R7; UUIDv7 sắp xếp được theo thời gian tạo.
- **Alternatives considered**: ID tự tăng (lộ số lượng, không tương thích giao diện).

## Ghi chú về Constitution

`.specify/memory/constitution.md` vẫn là mẫu chưa điền, nên chưa có cổng kiểm tra nguyên tắc nào để đối chiếu. Kế hoạch tự áp các nguyên tắc ngầm từ PRODUCT.md: làm luồng chính trước, chỉ hứa những gì làm được, thiết kế đủ mọi trạng thái, dữ liệu riêng tư theo mặc định. Nên chạy `/speckit-constitution` để chốt chính thức.
