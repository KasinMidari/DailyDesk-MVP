# Tasks: Quản lý công việc cá nhân theo trạng thái (DailyDesk MVP)

**Input**: Design documents from `/specs/001-personal-task-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Có. Spec yêu cầu (DL-003): test case thủ công + unit/integration test cho logic chính. Test chỉ viết cho phần cốt lõi để vừa 2 ngày.

**Organization**: Theo user story của spec.md. Thêm một phase "Mốc deploy + CI/CD" ngay sau Foundational, theo yêu cầu: **sáng mai (04/11) phải deploy được app và có CI/CD**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: làm song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: US1…US6 theo spec.md
- Đường dẫn tính từ gốc repo `D:\KITS\DailyDesk_MVP`. Backend mới: `DailyDesk_MVP/backend/`. Frontend có sẵn: `DailyDesk_MVP/frontend/`.

## Lịch 2 ngày (timebox)

| Khi nào | Phase | Kết quả phải có |
|---|---|---|
| Ngày 1 (03/11), chiều | Phase 1–2 | Backend chạy được ở máy, có `/health`, auth middleware, schema, test helpers |
| Ngày 1, tối | **Phase 3 (mốc)** | **Frontend (dữ liệu mock) live trên Vercel, backend `/health` live trên Render + Turso, GitHub Actions xanh, push `main` tự deploy** |
| Ngày 2 (04/11), sáng | Phase 4–6 (US1–US3, P1) | Đăng nhập Google thật, thêm/xem/đổi trạng thái task trên bản deploy |
| Ngày 2, chiều | Phase 7–8 (US4–US5, P2) | Sửa/xoá, lọc/sắp xếp có test |
| Ngày 2, tối | Phase 10 (Polish) | README, DECISIONS, TEST_CASES, PLAN, DAILY_LOG, sơ đồ, video demo |
| Nếu còn thời gian | Phase 9 (US6, P3) | Nhóm route B. **Cắt đầu tiên nếu trễ** |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Khởi tạo backend và sửa những gì đang chặn CI ở frontend.

- [X] T001 Tạo thư mục `DailyDesk_MVP/backend/` với `package.json` (`"type": "module"`, `"packageManager": "pnpm@10.24.0"`, `engines.node: ">=22"`), scripts `dev` (`tsx watch src/index.ts`), `build` (`tsc -p tsconfig.json`), `start` (`node dist/index.js`), `test` (`vitest run`), `typecheck` (`tsc --noEmit`), `db:push` (`drizzle-kit push`); cài deps `hono @hono/node-server drizzle-orm @libsql/client zod jose uuidv7` và devDeps `typescript tsx vitest drizzle-kit @types/node`
- [X] T002 [P] Tạo `DailyDesk_MVP/backend/tsconfig.json` (target ES2022, module NodeNext, strict, outDir `dist`, rootDir `src`) và `DailyDesk_MVP/backend/vitest.config.ts` (environment node, include `tests/**/*.test.ts`)
- [X] T003 [P] Tạo `DailyDesk_MVP/backend/.env.example` với `PORT=3000`, `DATABASE_URL=file:./data/dailydesk.db`, `DATABASE_AUTH_TOKEN=`, `SESSION_SECRET=change-me-32-chars-min`, `GOOGLE_CLIENT_ID=`, `AUTH_DEV_LOGIN=true`, `CORS_ORIGIN=http://localhost:5173`, và `DailyDesk_MVP/backend/.gitignore` (`node_modules`, `dist`, `data`, `.env`)
- [X] T004 [P] Sửa `DailyDesk_MVP/frontend/package.json`: `"build": "vite build"` (bỏ `tsc -b` vì còn ~48 lỗi kiểu có sẵn từ code cũ), thêm `"typecheck:mvp": "tsc -p tsconfig.mvp.json"`, `"test": "vitest run"`; cài devDep `vitest`
- [X] T005 [P] Tạo `DailyDesk_MVP/frontend/tsconfig.mvp.json` kế thừa `tsconfig.app.json` nhưng `include` chỉ `src/features/**`, `src/lib/**`, `src/mocks/**`, `src/pages/tasks.tsx` (phần code mới viết, hiện sạch lỗi), để CI kiểm tra kiểu mà không bị chặn bởi lỗi cũ
- [X] T006 [P] Tạo `DailyDesk_MVP/frontend/.env.example` với `VITE_USE_MOCK=true`, `VITE_BACKEND_URL=http://localhost:3000`, `VITE_GOOGLE_CLIENT_ID=`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung cho mọi story. **⚠️ Chưa xong phase này thì chưa làm story nào.**

- [X] T007 Viết `DailyDesk_MVP/backend/src/env.ts`: đọc biến môi trường bằng zod. `SESSION_SECRET` ≥ 32 ký tự; `AUTH_DEV_LOGIN` là boolean, mặc định `false`; `CORS_ORIGIN` là danh sách phân tách bằng dấu phẩy. Thiếu biến bắt buộc thì dừng với thông báo rõ ràng
- [X] T008 Viết `DailyDesk_MVP/backend/src/db/schema.ts` theo `data-model.md`:
  - `users`: `google_sub` unique not null, `email` not null, `name` not null, `avatar_url` null
  - `boards`: `user_id` FK cascade, `name` not null, `background_color` null, `background_url` null, `is_default` int 0/1
  - `lists`: `board_id` FK cascade, `name` not null, `order` int not null
  - `cards`: `list_id` FK cascade, `name` not null, `description` null, `due_at` text null, `start_date` null, `priority` text not null default `medium`, `completed` int 0/1, `due_complete` int 0/1, `order` int not null, `cover_color` null, các cột tương thích `reminder_minutes`, `repeat_frequency`, `repeat_interval`, `recurrence`, `recurrence_day`, `recurrence_weekday`, `cover_url`, `cover_public_id`, `cover_mode`, `is_template` đều null
  - `labels`, `card_labels` (PK kép), `checklist_items`, `comments`, `activities`
  - Thời gian `created_at`/`updated_at` dạng ISO text
  - Index: `boards(user_id)`, `lists(board_id)`, `cards(list_id)`, `cards(due_at)`
- [X] T009 [P] Viết `DailyDesk_MVP/backend/src/db/client.ts` (tạo libsql client từ `DATABASE_URL` + `DATABASE_AUTH_TOKEN`, export `createDb(url)` để test dùng `:memory:`) và `DailyDesk_MVP/backend/drizzle.config.ts`
- [X] T010 [P] Viết `DailyDesk_MVP/backend/src/validation.ts` (zod), thông báo tiếng Việt đúng câu chữ của frontend:
  - name: "tiêu đề cắt khoảng trắng còn 1–200 ký tự", lỗi `"Hãy nhập tiêu đề cho task."` hoặc `"Tiêu đề tối đa 200 ký tự."`
  - description: "≤ 2000 ký tự", lỗi `"Mô tả tối đa 2000 ký tự."`
  - priority: "∈ high / medium / low"
  - dueAt: "ISO 8601 hợp lệ; không ở quá khứ khi tạo hoặc khi giá trị hạn thay đổi", lỗi `"Hạn chót phải từ bây giờ trở đi."`
  - board/list name: "1–100 ký tự"
  - comment: "1–5000"
  - Helper `toFieldErrors(zodError)` trả về `{ message: "Dữ liệu chưa hợp lệ", fields }`
- [X] T011 [P] Viết `DailyDesk_MVP/backend/src/auth/session.ts`: ký/kiểm JWT HS256 bằng `jose`, payload `{ sub: userId }`, hạn 7 ngày
- [X] T012 Viết `DailyDesk_MVP/backend/src/auth/middleware.ts` `requireUser`: đọc `Authorization: Bearer`, kiểm token, `c.set("userId")`. Thiếu hoặc sai thì `401 { message: "Bạn cần đăng nhập" }` (phụ thuộc T011)
- [X] T013 Viết `DailyDesk_MVP/backend/src/app.ts` `createApp({ db, env })`:
  - CORS theo `CORS_ORIGIN`, logger
  - `GET /health` → `{ ok: true }`
  - `onError`: `HttpError` → status + `{ message }`; `ZodError` → 400 `fields`; còn lại → `500 { message: "Có lỗi xảy ra, vui lòng thử lại" }`, không lộ stack
  - Gắn router rỗng cho các nhóm route
- [X] T014 Viết `DailyDesk_MVP/backend/src/index.ts`: đọc env, tạo db, `serve(createApp(...), { port })`
- [X] T015 Viết `DailyDesk_MVP/backend/src/services/access.ts`:
  - `requireBoard(db, userId, boardId)`, `requireList(...)`, `requireCard(...)` lọc theo `boards.user_id = userId`
  - Không thuộc người gọi thì ném `HttpError(404, "Không tìm thấy …")`, **không dùng 403** (R6)
- [X] T016 Viết `DailyDesk_MVP/backend/tests/helpers.ts`:
  - `makeTestApp()` với SQLite `:memory:` + `migrate`/`push` schema
  - `loginAs(app, email)` gọi `POST /auth/dev` (bật `AUTH_DEV_LOGIN`) trả token
  - `authed(token)` tạo header
- [X] T017 [P] Viết `DailyDesk_MVP/backend/tests/health.test.ts`: `GET /health` → 200 `{ ok: true }`; route cần auth không có token → 401

**Checkpoint**: `pnpm --dir DailyDesk_MVP/backend test` xanh; `pnpm --dir DailyDesk_MVP/backend dev` trả `/health`.

---

## Phase 3: Mốc deploy + CI/CD (phải xong tối Ngày 1) 🚀

**Goal**: Sáng mai đã có link chạy thật và pipeline tự kiểm + tự deploy. Frontend tạm chạy dữ liệu mock (`VITE_USE_MOCK=true`), đủ để demo giao diện; backend thật chỉ cần `/health`.

**Independent Test**: Mở link Vercel thấy màn đăng nhập rồi vào được "Việc của tôi" (mock). `curl https://<render>/health` → `{"ok":true}`. Push một commit lên `main` thì tab Actions xanh và cả Vercel lẫn Render tự deploy bản mới.

- [X] T018 Tạo `.github/workflows/ci.yml` ở gốc repo. Trigger: `push` và `pull_request` vào `main`. Hai job dùng `pnpm/action-setup@v4` (pnpm 10.24.0) + `actions/setup-node@v4` (node 22, cache pnpm):
  - `backend` (working-directory `DailyDesk_MVP/backend`): `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build`
  - `frontend` (working-directory `DailyDesk_MVP/frontend`): `pnpm install --frozen-lockfile`, `pnpm typecheck:mvp`, `pnpm test --passWithNoTests`, `pnpm build`
- [X] T019 [P] Thêm `DailyDesk_MVP/frontend/vercel.json`: rewrite mọi đường dẫn về `/index.html` để React Router chạy được khi tải lại trang (`/lich`, `/board/:id`)
- [X] T020 [P] Thêm `render.yaml` ở gốc repo (Blueprint): một Web Service `dailydesk-api`
  - `rootDir: DailyDesk_MVP/backend`, `buildCommand: corepack enable && pnpm install --frozen-lockfile && pnpm build` (bảng được tạo tự động khi server khởi động, xem `src/db/client.ts`, nên không cần `db:push`), `startCommand: pnpm start`
  - `healthCheckPath: /health`, `autoDeploy: true`, plan free
  - envVars `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SESSION_SECRET` (generateValue), `GOOGLE_CLIENT_ID`, `CORS_ORIGIN`, `AUTH_DEV_LOGIN` để `sync: false`
- [ ] T021 Tạo database trên Turso (`turso db create dailydesk`), lấy URL `libsql://…` và token. Điền vào Render, **không commit**
- [ ] T022 Kết nối Vercel với repo GitHub: project root `DailyDesk_MVP/frontend`, framework Vite, env `VITE_USE_MOCK=true`. Bật Production Branch = `main` (Vercel tự deploy mỗi lần push)
- [ ] T023 Kết nối Render Blueprint với repo (đọc `render.yaml`), đặt `CORS_ORIGIN` = domain Vercel + `http://localhost:5173`, deploy lần đầu, kiểm `/health`
- [ ] T024 Vào GitHub, Settings → Branches, bật branch protection cho `main`: bắt buộc check `backend` và `frontend` của `ci.yml` pass trước khi merge. Trên Render, đặt "Auto-Deploy: After CI checks pass" nếu có. Ghi lại link Vercel, link Render và link Actions vào `DailyDesk_MVP/README.md` mục "Bản chạy thật"
- [ ] T025 Push lên `main`, xác nhận Actions xanh, Vercel và Render đều deploy. Chụp ảnh màn hình 3 trang (Actions, Vercel, Render) vào `DailyDesk_MVP/docs/deploy/`

**Checkpoint (sáng 04/11)**: link Vercel + `/health` Render chạy; CI xanh; push là tự deploy. ✅ Đạt yêu cầu "sáng mai deploy được + có CI/CD".

---

## Phase 4: User Story 1 - Đăng nhập và có không gian làm việc riêng (Priority: P1) 🎯 MVP

**Goal**: Đăng nhập Google thật, lần đầu tự tạo user + board mặc định; mỗi người chỉ thấy dữ liệu của mình.

**Independent Test**: Hai tài khoản khác nhau: A tạo task, B không thấy, và B mở thẳng `/boards/{idA}` thì nhận 404.

### Tests for User Story 1

- [X] T026 [P] [US1] `DailyDesk_MVP/backend/tests/auth.test.ts`:
  - `POST /auth/dev` lần đầu tạo user + board mặc định "Việc của tôi" có 3 list `Todo`(0)/`Doing`(1)/`Done`(2)
  - Lần 2 không tạo trùng
  - `GET /auth/me` trả user
  - `POST /auth/google` với token sai → 401
  - `/auth/dev` khi `AUTH_DEV_LOGIN=false` → 404
- [X] T027 [P] [US1] `DailyDesk_MVP/backend/tests/isolation.test.ts`: user B gọi `GET/PUT/DELETE /boards/{boardA}`, `GET /boards/{boardA}/cards/{cardA}`, `PUT …/cards/{cardA}` → đều 404; `GET /boards/cards/all` của B không chứa card của A

### Implementation for User Story 1

- [X] T028 [P] [US1] `DailyDesk_MVP/backend/src/auth/google.ts`: `verifyGoogleIdToken(credential)` bằng `createRemoteJWKSet("https://www.googleapis.com/oauth2/v3/certs")`, kiểm `iss` ∈ {`accounts.google.com`, `https://accounts.google.com`}, `aud = GOOGLE_CLIENT_ID`, `email_verified = true`
- [X] T029 [US1] `DailyDesk_MVP/backend/src/services/users.ts`: `upsertUser({ googleSub, email, name, avatarUrl })`; khi tạo mới thì tạo board `is_default=1` tên "Việc của tôi" + list `Todo`/`Doing`/`Done`, trong một transaction
- [X] T030 [US1] `DailyDesk_MVP/backend/src/routes/auth.ts`:
  - `POST /auth/google` `{ credential }` → `{ token, user: { id, name, email, picture } }`
  - `POST /auth/dev` `{ email, name }` (chỉ khi `AUTH_DEV_LOGIN`, `googleSub = "dev|" + email`)
  - `GET /auth/me`
  - Gắn vào `app.ts`
- [X] T031 [US1] Viết lại phần cài đặt trong `DailyDesk_MVP/frontend/src/lib/auth.tsx`, giữ nguyên API hook (`isAuthenticated`, `isLoading`, `user`, `loginWithRedirect`, `logout`, `getAccessTokenSilently`):
  - Khi `USE_MOCK` thì giữ bản giả lập hiện có
  - Khi không thì nạp `https://accounts.google.com/gsi/client`, `google.accounts.id.initialize({ client_id: VITE_GOOGLE_CLIENT_ID, callback })`; `loginWithRedirect` gọi `prompt()`, callback POST `/auth/google`, lưu `{ token, user }` vào localStorage `dailydesk-session`
  - `getAccessTokenSilently` trả token
  - `logout` xoá session
- [X] T032 [US1] Trong `DailyDesk_MVP/frontend/src/components/sign-in-screen.tsx`, khi không mock thì render nút Google chính thức (`google.accounts.id.renderButton`) thay cho nút giả, giữ dòng lỗi "Không đăng nhập được…" khi callback thất bại; ẩn đoạn "Bản demo…" khi không mock
- [ ] T033 [US1] Tạo OAuth Client ID (Web) trên Google Cloud Console, Authorized JavaScript origins = `http://localhost:5173` + domain Vercel; điền `GOOGLE_CLIENT_ID` (Render) và `VITE_GOOGLE_CLIENT_ID` (Vercel)

**Checkpoint**: Đăng nhập Google thật ở máy; T026, T027 xanh.

---

## Phase 5: User Story 2 - Thêm task và xem danh sách công việc (Priority: P1)

**Goal**: Tạo task với tiêu đề bắt buộc, mô tả, hạn, ưu tiên; danh sách "Việc của tôi" lấy dữ liệu thật.

**Independent Test**: Thêm task chỉ có tiêu đề và task đủ trường, tải lại trang vẫn còn. Tiêu đề trống hoặc hạn quá khứ thì 400 kèm `fields`.

### Tests for User Story 2

- [X] T034 [P] [US2] `DailyDesk_MVP/backend/tests/cards.test.ts` (phần tạo):
  - Tạo task chỉ có `name` → 201, `priority = "medium"`, nằm trong list Todo
  - `name = "   "` → 400 `fields.name = "Hãy nhập tiêu đề cho task."`
  - name 201 ký tự → 400
  - description 2001 ký tự → 400
  - `priority = "urgent"` → 400
  - `dueAt` quá khứ → 400 `fields.dueAt = "Hạn chót phải từ bây giờ trở đi."`
  - `listId` của board khác → 400 hoặc 404
- [X] T035 [P] [US2] `DailyDesk_MVP/backend/tests/boards-lists.test.ts`:
  - `GET /boards` trả `{ ownedBoards, invitedBoards: [] }` có `lists[].cards[]` sắp theo `order`
  - CRUD list
  - `DELETE` board mặc định → 403
  - `GET /boards/cards/all` có `listName`, `boardId`, `boardName`

### Implementation for User Story 2

- [X] T036 [P] [US2] `DailyDesk_MVP/backend/src/services/serialize.ts`: `toCardJson(row, labels)` trả đúng kiểu Card trong `contracts/api.md` (camelCase, `deadline` = `dueAt`, `members: []`, `attachments: []`, boolean thật cho `completed`/`dueComplete`/`isTemplate`)
- [X] T037 [US2] `DailyDesk_MVP/backend/src/services/boards.ts`: `listBoards`, `getBoardWithLists`, `createBoard` (chấp nhận `id` client gửi nếu là UUID hợp lệ và chưa tồn tại), `updateBoard`, `deleteBoard` (chặn board mặc định bằng `HttpError(403)`)
- [X] T038 [P] [US2] `DailyDesk_MVP/backend/src/services/lists.ts`: `createList`, `getList`, `updateList` (`name` 1–100, `order` ≥ 0), `deleteList` (cascade)
- [X] T039 [US2] `DailyDesk_MVP/backend/src/services/cards.ts`:
  - `createCard`: validate theo T010, mặc định `priority = "medium"`, `order` = max+1 nếu không gửi; nếu list đích là Done thì `completed = 1`; ghi activity `card.created`
  - `getCard`
  - `listAllCardsForUser`: join lists/boards, `WHERE boards.user_id = :me`
- [X] T040 [US2] `DailyDesk_MVP/backend/src/routes/boards.ts` + `routes/lists.ts` + `routes/cards.ts` (phần GET/POST) theo nhóm A của `contracts/api.md`; **khai báo `GET /boards/cards/all` trước `GET /boards/:id`**; tất cả đi qua `requireUser`
- [X] T041 [US2] Bật dữ liệu thật ở máy: `DailyDesk_MVP/frontend/.env.local` với `VITE_USE_MOCK=false`; chạy luồng thêm task ở màn "Việc của tôi" (`src/features/tasks/tasks-page.tsx`) và trang Board. Sửa chỗ lệch hình dạng JSON ở backend (không sửa frontend) cho tới khi khớp

**Checkpoint**: T034, T035 xanh; thêm/xem task chạy với backend thật.

---

## Phase 6: User Story 3 - Đổi trạng thái Todo / Doing / Done (Priority: P1)

**Goal**: Đổi trạng thái = chuyển list; `completed` tự đặt theo list đích.

**Independent Test**: Chuyển một task Todo → Doing → Done → Todo. Số đếm từng tab đúng, `completed` đúng, tải lại vẫn giữ.

- [X] T042 [P] [US3] Thêm vào `DailyDesk_MVP/backend/tests/cards.test.ts`: `PUT …/cards/{id}` `{ listId: doneListId }` → `completed = true`, `dueComplete = true`; chuyển về Todo → `false`; `listId` thuộc board khác → 400/404
- [X] T043 [US3] Trong `DailyDesk_MVP/backend/src/services/cards.ts` viết `moveCard`/phần `listId` của `updateCard`: kiểm list cùng board; đặt `completed`/`due_complete` theo `statusFromList(list.name)` (todo mặc định; doing: `doing`/`đang làm`/`in progress`; done: `done`/`xong`/`đã xong`/`hoàn thành`); ghi activity `card.moved`
- [X] T044 [US3] `PUT /boards/:boardId/cards/:id` trong `DailyDesk_MVP/backend/src/routes/cards.ts` gọi `updateCard`; kiểm thủ công menu trạng thái ở "Việc của tôi", ô đánh dấu xong và menu "Chuyển sang …" trên Board với backend thật
- [ ] T045 [US3] Deploy bản có US1–US3: trên Vercel đặt `VITE_USE_MOCK=false`, `VITE_BACKEND_URL=https://<render>`; chạy bước 1–3 của `quickstart.md` trên link thật

**Checkpoint (trưa 04/11)**: luồng chính P1 chạy end-to-end trên bản deploy. **MVP đạt yêu cầu đề bài.**

---

## Phase 7: User Story 4 - Sửa và xoá task (Priority: P2)

**Goal**: Sửa mọi trường; xoá cần xác nhận, có hoàn tác (giao diện đã làm; backend phải hỗ trợ).

**Independent Test**: Sửa tiêu đề task quá hạn mà không đổi hạn → 200; xoá rồi hoàn tác thì task trở lại; tải lại vẫn đúng.

- [X] T046 [P] [US4] Thêm vào `DailyDesk_MVP/backend/tests/cards.test.ts`:
  - Sửa `name` của task có `dueAt` quá khứ mà không gửi `dueAt` → 200
  - Gửi `dueAt` quá khứ **mới** → 400
  - `DELETE` → 200, `GET` lại → 404, checklist/comments/card_labels cũng bị xoá
- [X] T047 [US4] Hoàn thiện `updateCard` trong `DailyDesk_MVP/backend/src/services/cards.ts`:
  - Áp quy tắc "hạn quá khứ chỉ bị từ chối khi giá trị hạn **thay đổi**"
  - `deadline` là bí danh của `dueAt`
  - `labels: {id}[]` thay toàn bộ `card_labels` (label phải cùng chủ)
  - Cập nhật `updated_at`
  - Ghi activity `card.renamed` / `deadline.changed`
- [X] T048 [US4] `DELETE /boards/:boardId/cards/:id` trong `DailyDesk_MVP/backend/src/routes/cards.ts` (cascade theo FK). Kiểm "Hoàn tác" trên giao diện tạo lại task qua `POST` với ID mới

**Checkpoint**: T046 xanh; sửa/xoá/hoàn tác chạy trên backend thật.

---

## Phase 8: User Story 5 - Lọc, tìm kiếm và sắp xếp (Priority: P2)

**Goal**: Giao diện đã có lọc, sắp xếp và nhóm theo hạn; cần test tự động cho logic (DL-003, "điểm nhấn").

**Independent Test**: `pnpm --dir DailyDesk_MVP/frontend test` xanh với các trường hợp của FR-015 – FR-017.

- [X] T049 [P] [US5] `DailyDesk_MVP/frontend/src/features/tasks/logic.test.ts` cho `src/features/tasks/logic.ts`:
  - `compare("deadline")` và `compare("deadline-desc")` đều để task không hạn cuối
  - Task Done luôn sau task chưa xong
  - `compare("priority")` thứ tự high > medium > low > null
  - `matches` tìm "bao cao" khớp "Nộp báo cáo"
  - `groupOf` phân Quá hạn / Hôm nay / 7 ngày tới / Sau đó / Không có hạn / Đã xong với `now` cố định
  - `validateTask`: tiêu đề trống, 201 ký tự, mô tả 2001 ký tự, hạn quá khứ khi `isNew`, hạn quá khứ khi sửa không đổi hạn
- [X] T050 [P] [US5] `DailyDesk_MVP/frontend/src/lib/date.test.ts` cho `formatShort`/`formatDue`/`formatWeekdayDate` (Hôm nay, Ngày mai, `T4, 4/11`, khác năm thêm `/yyyy`, giờ 24h)

**Checkpoint**: Test frontend chạy trong CI (job `frontend` của T018).

---

## Phase 9: User Story 6 - Board, lịch và hộp thoại chi tiết đầy đủ (Priority: P3) ⏳ cắt nếu trễ

**Goal**: Các route nhóm B để hộp thoại chi tiết (ngày, việc con, nhãn, bình luận, hoạt động) và tìm kiếm toàn cục chạy với backend thật.

**Independent Test**: Mở hộp thoại chi tiết của một task, thêm việc con, nhãn, bình luận; tải lại vẫn còn; ô tìm kiếm trên header tìm ra task.

- [X] T051 [P] [US6] `DailyDesk_MVP/backend/src/routes/due.ts`: `PATCH`/`DELETE /boards/:boardId/cards/:cardId/due` theo `contracts/api.md`; `startDate ≤ dueAt`
- [X] T052 [P] [US6] `DailyDesk_MVP/backend/src/routes/checklist.ts` + service: CRUD `…/checklist-items`, `name` 1–200, trả `members: []`
- [X] T053 [P] [US6] `DailyDesk_MVP/backend/src/routes/labels.ts` + service: CRUD `/users/:userId/labels` (bỏ qua `:userId`, luôn là người gọi), `color` `#RRGGBB`, `name` ≤ 50
- [X] T054 [P] [US6] `DailyDesk_MVP/backend/src/routes/comments.ts` + service: CRUD comments (`content` 1–5000, chỉ tác giả sửa hoặc xoá, nếu không thì 403), `GET …/activities`, `GET …/timeline` (mới nhất trước, có `type`)
- [X] T055 [P] [US6] `DailyDesk_MVP/backend/src/routes/search.ts`: `GET /search?q=&types=&boardId=&limit=` cho `board`/`list`/`card`, so khớp bỏ dấu tiếng Việt, chỉ dữ liệu của người gọi
- [X] T056 [US6] Trong `DailyDesk_MVP/frontend/src/lib/features.ts` thêm `SHOW_TEMPLATES`, `SHOW_ATTACHMENTS`, `SHOW_COVER_UPLOAD` = `USE_MOCK`, rồi bọc các nút tương ứng:
  - "Mẫu board" ở `src/components/app-sidebar.tsx`
  - "Đính kèm" ở `src/components/card-edit-dialog/card-edit-dialog.tsx`
  - nút đổi ảnh bìa ở `card-edit-dialog.tsx`
  - ảnh nền trong `src/components/create-board-dialog.tsx` và `edit-board-dialog.tsx`

  Mục đích: khi chạy backend thật không còn nút nào dẫn tới route nhóm C.

> Nếu không kịp Phase 9: **vẫn phải làm T056**, chuyển nó lên trước Phase 10, để bản deploy không có nút hỏng. Phần còn thiếu ghi vào "Ngoài phạm vi / Hạn chế" của README.

---

## Phase 10: Polish & Minh chứng chấm điểm (tối 04/11)

**Purpose**: Đủ các mục DL-001 … DL-010 của spec.

- [ ] T057 [P] `DailyDesk_MVP/docs/TEST_CASES.md`: một dòng cho mỗi bước 1–8 của `quickstart.md` + các edge case trong spec. Cột: ID, bước, kỳ vọng, kết quả (Pass/Fail), ngày chạy. Chạy trên bản deploy và điền kết quả (DL-003)
- [ ] T058 [P] `DailyDesk_MVP/docs/DECISIONS.md` rút gọn từ `specs/001-personal-task-management/research.md` R1–R10, mỗi mục ≤ 4 dòng: quyết định, lý do, phương án bỏ (DL-008)
- [ ] T059 [P] `DailyDesk_MVP/docs/PLAN.md`: bảng WBS theo 2 ngày lấy từ "Lịch 2 ngày" ở đầu file này, mỗi việc có Definition of Done và mốc giờ (DL-004)
- [ ] T060 [P] `DailyDesk_MVP/docs/DAILY_LOG.md`: log Ngày 1 và Ngày 2 (hôm qua / hôm nay / vướng mắc). Ghi rõ ít nhất 1 rủi ro và cách ứng phó, ví dụ "Render free ngủ 15 phút → mở trước khi quay demo", "~48 lỗi kiểu cũ chặn build → CI chỉ kiểm kiểu phần code mới (tsconfig.mvp.json)" (DL-005, DL-006)
- [ ] T061 [P] `DailyDesk_MVP/docs/usecase.png` (actor Người dùng: đăng nhập, thêm/sửa/xoá task, đổi trạng thái, lọc/sắp xếp, đăng xuất) và `DailyDesk_MVP/docs/erd.png` xuất từ sơ đồ mermaid trong `data-model.md` (DL-002)
- [ ] T062 `DailyDesk_MVP/README.md`: vấn đề cần giải quyết; mục tiêu; ảnh chụp màn hình; link bản chạy thật + link Actions; cách chạy (theo `quickstart.md`); chức năng đã làm; hạn chế hiện tại; ngoài phạm vi (nhóm C, realtime, nhóm làm việc); quyết định kỹ thuật (link DECISIONS.md); tự đánh giá / Lessons Learned / nếu có thêm thời gian (DL-007)
- [ ] T063 Quay video demo ≤ 2 phút theo bước 1–7 của `quickstart.md` trên bản deploy (mở link Render trước cho "thức dậy"), đặt link trong README (DL-009)
- [ ] T064 Kiểm lịch sử commit: ≥ 5 commit có ý nghĩa, tiếng Việt, không có dòng ghi tác giả AI; push `main`; xác nhận CI xanh và bản deploy cuối cùng chạy (DL-001, DL-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 → Phase 2 → Phase 3 (mốc deploy)**: tuần tự, phải xong trong Ngày 1.
- **Phase 4 (US1)** cần Phase 2 (auth middleware, access, test helpers). Phase 3 không chặn US1 nhưng nên xong trước để mọi commit sau đều qua CI.
- **Phase 5 (US2)** cần US1 (user + board mặc định để có list).
- **Phase 6 (US3)** cần US2 (card và list đã có).
- **Phase 7 (US4)** cần US2; độc lập với US3.
- **Phase 8 (US5)** độc lập với backend: làm song song bất kỳ lúc nào sau Phase 1 (T004).
- **Phase 9 (US6)** cần US2; tuỳ chọn, trừ **T056 là bắt buộc trước khi deploy dữ liệu thật**.
- **Phase 10** cần US1–US4 chạy trên bản deploy.

### User Story Dependencies

```text
Setup → Foundational → [Mốc deploy + CI/CD]
                    ↘
                     US1 → US2 → US3 ──┐
                            └→ US4 ────┤→ Polish
US5 (frontend test) ────────────────────┤
US6 (tuỳ chọn, T056 bắt buộc) ──────────┘
```

### Within Each User Story

- Viết test trước (để fail), rồi service → route → nối giao diện → kiểm thủ công.
- Commit sau mỗi task hoặc nhóm task nhỏ, message tiếng Việt.

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005, T006 song song sau T001.
- Phase 2: T009, T010, T011 song song; T017 song song với T015.
- Phase 3: T019, T020 song song; T021–T023 làm trên web dashboard trong lúc CI chạy.
- US1: T026, T027, T028 song song.
- US2: T034, T035, T036, T038 song song.
- US5 (T049, T050) làm song song với toàn bộ phần backend.
- US6: T051–T055 khác file, song song hoàn toàn.
- Phase 10: T057–T061 song song.

---

## Parallel Example: User Story 2

```bash
# Viết test và phần độc lập cùng lúc:
Task: "T034 [US2] tests tạo card trong DailyDesk_MVP/backend/tests/cards.test.ts"
Task: "T035 [US2] tests boards/lists trong DailyDesk_MVP/backend/tests/boards-lists.test.ts"
Task: "T036 [US2] serialize Card JSON trong DailyDesk_MVP/backend/src/services/serialize.ts"
Task: "T038 [US2] lists service trong DailyDesk_MVP/backend/src/services/lists.ts"
# Sau đó tuần tự: T037 → T039 → T040 → T041
```

---

## Implementation Strategy

### Deploy sớm, MVP sau (vì hạn 2 ngày)

1. **Tối Ngày 1**: Phase 1 → 2 → **3**. Có link thật (frontend mock + backend `/health`) và CI/CD. Dù phần sau trễ, vẫn có bản chạy để nộp.
2. **Sáng Ngày 2**: US1 → US2 → US3, rồi deploy dữ liệu thật (T045). Đây là **MVP tối thiểu đạt đề bài**.
3. **Chiều Ngày 2**: US4 + US5 (test), T056.
4. **Tối Ngày 2**: Phase 10 (tài liệu + video). US6 chỉ làm nếu còn giờ.

### Điểm cắt khi trễ (theo thứ tự)

1. Bỏ US6 (T051–T055); giữ T056.
2. Bỏ T050; giữ T049 (test logic chính).
3. Nếu Google OAuth gặp sự cố: deploy với `AUTH_DEV_LOGIN=true` + nút "Đăng nhập tài khoản thử nghiệm", ghi rõ trong README phần hạn chế (rủi ro + ứng phó cho DL-006).

### Notes

- [P] = khác file, không phụ thuộc task chưa xong.
- Không commit `.env`, token Turso, `SESSION_SECRET`.
- Không sửa repo DailyDesk cũ (`D:\KITS\DailyDesk_MVP\DailyDesk`).
- Giữ đường dẫn và hình dạng JSON khớp `frontend/src/mocks/server.ts`; khi lệch thì sửa backend.
