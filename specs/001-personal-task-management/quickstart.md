# Quickstart & Validation: 001-personal-task-management

Hướng dẫn chạy và kiểm chứng tính năng end-to-end. Chi tiết route xem [contracts/api.md](contracts/api.md); chi tiết dữ liệu xem [data-model.md](data-model.md).

## Yêu cầu
- Node.js 22 LTS, pnpm 10
- (Khi dùng Google thật) một OAuth Client ID loại "Web application" trên Google Cloud, Authorized JavaScript origins gồm `http://localhost:5173` và domain Vercel

## Chạy ở máy

```bash
# Backend
cd DailyDesk_MVP/backend
cp .env.example .env        # DATABASE_URL=file:./data/dailydesk.db, SESSION_SECRET=..., GOOGLE_CLIENT_ID=..., AUTH_DEV_LOGIN=true, CORS_ORIGIN=http://localhost:5173
pnpm install
pnpm db:push                # tạo bảng
pnpm dev                    # http://localhost:3000

# Frontend (terminal khác)
cd DailyDesk_MVP/frontend
# .env: VITE_USE_MOCK=false, VITE_BACKEND_URL=http://localhost:3000, VITE_GOOGLE_CLIENT_ID=...
pnpm dev                    # http://localhost:5173
```

Kiểm nhanh: `curl http://localhost:3000/health` → `{"ok":true}`.

## Chạy test tự động

```bash
cd DailyDesk_MVP/backend && pnpm test     # test tích hợp API trên SQLite :memory:
cd DailyDesk_MVP/frontend && pnpm test    # unit test logic lọc/sắp xếp/kiểm tra
```

Kỳ vọng: tất cả pass, gồm ít nhất các nhóm sau:

| Nhóm test | Chứng minh |
|---|---|
| auth: thiếu hoặc sai token → 401 | FR-002 |
| isolation: user B GET/PUT/DELETE card của A → 404 | FR-003, SC-005 |
| create: tiêu đề trống, 201 ký tự, hạn quá khứ, priority lạ → 400 kèm `fields` | FR-005, FR-007, SC-006 |
| update: sửa tên task quá hạn mà không đổi hạn → 200 | US4 kịch bản 2 |
| status: chuyển list sang Done → `completed=true`; rời Done → `false` | FR-010, data-model |
| cards/all: trả `listName`, `boardName`, chỉ của người gọi | FR-012 |
| first login: tạo board mặc định có Todo/Doing/Done | Assumptions |
| logic (FE): không có hạn nằm cuối; Done nằm cuối; tìm không dấu; danh sách phẳng theo thứ tự sắp xếp | FR-015 – FR-017 |

## Kịch bản kiểm chứng thủ công (luồng chính, dùng cho video demo ≤ 2 phút)

1. Mở `http://localhost:5173` → chỉ thấy màn đăng nhập. Bấm "Tiếp tục với Google" (hoặc tài khoản dev) → vào "Việc của tôi" trống, có nút "Thêm task đầu tiên". *(US1, US2-5)*
2. Bấm "Thêm task" (hoặc phím `N`), để trống tiêu đề rồi lưu → thấy "Hãy nhập tiêu đề cho task.". Nhập tiêu đề, chọn hạn ngày mai, ưu tiên Cao → task hiện ở nhóm "7 ngày tới" hoặc "Hôm nay", trạng thái Todo. *(US2)*
3. Mở menu trạng thái của task → chọn Doing → số đếm tab Todo/Doing đổi, dòng được làm nổi bật, có thông báo. *(US3)*
4. Bấm vào task, đổi tiêu đề → "Đã lưu thay đổi". *(US4)*
5. Chọn tab Doing, lọc Ưu tiên: Cao, sắp xếp "Ưu tiên cao trước"; tìm "bao cao" không dấu. Tải lại trang → bộ lọc vẫn giữ. *(US5)*
6. Xoá task → xác nhận → bấm "Hoàn tác" → task trở lại. Xoá lần nữa và tải lại → task không còn. *(US4)*
7. Đăng xuất, đăng nhập tài khoản thứ hai → không thấy task nào của tài khoản đầu. *(US1-3, SC-005)*
8. Tắt backend, tải lại trang → thấy "Không tải được danh sách task" và nút "Thử lại". Bật lại backend, bấm "Thử lại" → danh sách hiện ra. *(FR-020)*

Mỗi bước tương ứng một dòng trong `TEST_CASES.md`, ghi Pass/Fail và ngày chạy.

## Kiểm chứng sau khi deploy
- `GET https://<backend>.onrender.com/health` → `{"ok":true}` (request đầu có thể chờ khoảng 30–50 giây do gói miễn phí ngủ).
- Lặp lại bước 1–7 trên domain Vercel; Google OAuth phải có domain Vercel trong Authorized origins.
