# Implementation Plan: Quản lý công việc cá nhân theo trạng thái (DailyDesk MVP)

**Branch**: `001-personal-task-management` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-personal-task-management/spec.md`

## Summary

Xây backend thật cho DailyDesk: đăng nhập Google, mỗi người dùng một không gian riêng, CRUD task (tiêu đề, mô tả, hạn chót, độ ưu tiên), trạng thái Todo/Doing/Done theo list trong board, và lọc/sắp xếp. Frontend React đã có và đang chạy trên backend giả trong trình duyệt. Hướng kỹ thuật:

- Backend Hono + TypeScript trên Node 22, SQLite (libsql + Drizzle; Turso khi deploy).
- Giữ đúng đường dẫn và hình dạng JSON của backend giả, để frontend chuyển sang dữ liệu thật chỉ bằng biến môi trường.
- Chỉ cài nhóm route A (bắt buộc) và B (nên có); nhóm C (cộng tác, mẫu, đính kèm) nằm ngoài phạm vi.

Chi tiết quyết định ở [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.x trên Node.js 22 LTS (backend); TypeScript 5.8 + React 19 (frontend, đã có)

**Primary Dependencies**: Backend: `hono` 4, `@hono/node-server`, `drizzle-orm` + `drizzle-kit`, `@libsql/client`, `zod` 4, `jose` (kiểm Google ID token và ký token phiên), `uuidv7`. Frontend (đã có): Vite 7, Tailwind 4, TanStack Query 5, openapi-fetch; thêm Google Identity Services script.

**Storage**: SQLite: file cục bộ `backend/data/dailydesk.db` khi dev, `:memory:` khi test, Turso khi deploy.

**Testing**: Vitest (backend: test tích hợp qua `app.request()`; frontend: unit test `src/features/tasks/logic.ts`) + `TEST_CASES.md` thủ công.

**Target Platform**: Backend: Node web service (Render free tier). Frontend: SPA tĩnh (Vercel). Trình duyệt Chrome/Edge/Firefox/Safari bản mới, từ 375px.

**Project Type**: Web application (frontend + backend trong cùng repo).

**Performance Goals**: API p95 < 300 ms ở máy và < 800 ms khi deploy (không tính lần đánh thức đầu của Render); lọc/sắp xếp phía client < 1 s với 200 task (SC-004).

**Constraints**: Một người, một tuần; chi phí 0 đồng; không realtime; không kéo-thả bắt buộc; mọi thông báo bằng tiếng Việt; không lộ dữ liệu giữa người dùng.

**Scale/Scope**: ≤ 50 người dùng thử, ≤ 500 task mỗi người; nhóm A ~19 route, nhóm B ~15 route; 4 bảng lõi + 5 bảng phụ.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` vẫn là mẫu chưa điền, nên **chưa có cổng bắt buộc nào**. Tạm áp các nguyên tắc rút từ `DailyDesk_MVP/frontend/PRODUCT.md` và đề bài:

| Nguyên tắc tạm thời | Trước Phase 0 | Sau Phase 1 |
|---|---|---|
| Luồng chính trước, cắt phần dở dang | ✅ Nhóm C bị loại khỏi phạm vi | ✅ contracts chia A/B/C; tasks sẽ làm A trước |
| Chỉ hứa điều làm được | ✅ Spec có mục Ngoài phạm vi | ✅ Frontend ẩn nút của nhóm C khi chạy backend thật |
| Dữ liệu riêng tư theo mặc định | ✅ FR-003 | ✅ R6: mọi truy vấn lọc theo `user_id`, trả 404 thay vì 403; có test cách ly |
| Có bằng chứng kiểm thử | ✅ DL-003 | ✅ quickstart liệt kê nhóm test tự động và kịch bản thủ công |
| Đơn giản, chi phí 0 | ✅ | ✅ SQLite/Turso, Render, Vercel đều miễn phí |

Không có vi phạm, nên không cần Complexity Tracking. Khuyến nghị chạy `/speckit-constitution` để chốt chính thức trước `/speckit-tasks`.

## Project Structure

### Documentation (this feature)

```text
specs/001-personal-task-management/
├── plan.md              # File này
├── research.md          # Phase 0: quyết định kỹ thuật (nguồn cho DECISIONS.md)
├── data-model.md        # Phase 1: ERD, bảng, quy tắc, chuyển trạng thái
├── quickstart.md        # Phase 1: cách chạy và kịch bản kiểm chứng
├── contracts/
│   └── api.md           # Phase 1: REST contract nhóm A/B/C
├── checklists/
│   └── requirements.md  # Từ /speckit-specify
└── tasks.md             # Phase 2 (/speckit-tasks, chưa tạo)
```

### Source Code (repository root)

```text
DailyDesk_MVP/
├── backend/                       # MỚI
│   ├── src/
│   │   ├── index.ts               # khởi động server (node-server), đọc env
│   │   ├── app.ts                 # tạo Hono app: CORS, logger, onError, gắn routes (dùng chung cho test)
│   │   ├── env.ts                 # đọc và kiểm tra biến môi trường bằng zod
│   │   ├── db/
│   │   │   ├── schema.ts          # bảng Drizzle theo data-model.md
│   │   │   └── client.ts          # tạo libsql client từ DATABASE_URL
│   │   ├── auth/
│   │   │   ├── google.ts          # kiểm Google ID token (jose + JWKS)
│   │   │   ├── session.ts         # ký / kiểm token phiên
│   │   │   └── middleware.ts      # requireUser → c.set("userId")
│   │   ├── validation.ts          # schema zod + thông báo tiếng Việt
│   │   ├── services/              # boards, lists, cards, labels, checklist, comments, search (lọc theo userId)
│   │   └── routes/                # auth, boards, lists, cards, due, checklist, labels, comments, search
│   ├── tests/
│   │   ├── helpers.ts             # app với DB :memory:, tạo 2 user + token
│   │   ├── auth.test.ts
│   │   ├── isolation.test.ts
│   │   ├── cards.test.ts          # tạo/sửa/xoá/kiểm tra dữ liệu/đổi trạng thái
│   │   └── boards-lists.test.ts
│   ├── drizzle.config.ts
│   ├── .env.example
│   └── package.json
├── frontend/                      # ĐÃ CÓ
│   ├── src/lib/auth.tsx           # SỬA: Google Identity Services → POST /auth/google
│   ├── src/lib/features.ts        # SỬA: thêm cờ ẩn nhóm C khi dùng backend thật
│   ├── src/mocks/                 # GIỮ: chạy khi VITE_USE_MOCK != "false"
│   └── src/features/tasks/logic.test.ts   # MỚI: unit test
└── docs/                          # MỚI: minh chứng chấm điểm
    ├── usecase.png, erd.png       # DL-002 (ERD lấy từ data-model.md)
    ├── PLAN.md                    # DL-004: WBS theo ngày + Definition of Done
    ├── DAILY_LOG.md               # DL-005, DL-006
    ├── TEST_CASES.md              # DL-003
    └── DECISIONS.md               # DL-008 (rút từ research.md)
README.md (ở DailyDesk_MVP/)        # DL-007
```

**Structure Decision**: Web application gồm hai thư mục anh em `DailyDesk_MVP/backend` (mới) và `DailyDesk_MVP/frontend` (đã có), cùng một repo Git. Repo DailyDesk cũ (`D:\KITS\DailyDesk_MVP\DailyDesk`) chỉ để tham khảo, không sửa và không dùng lại code backend cũ. `app.ts` tách khỏi `index.ts` để test gọi `app.request()` mà không mở cổng mạng.

## Complexity Tracking

Không có vi phạm cần biện minh.

## Phase status

- [x] Phase 0: research.md (R1–R10, không còn NEEDS CLARIFICATION)
- [x] Phase 1: data-model.md, contracts/api.md, quickstart.md
- [x] Constitution Check sau thiết kế: đạt (theo nguyên tắc tạm thời)
- [ ] Phase 2: `/speckit-tasks`
