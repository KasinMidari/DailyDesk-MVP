# API Contract: DailyDesk backend (REST/JSON)

Base URL: `VITE_BACKEND_URL` (mặc định `http://localhost:3000`). Hình dạng JSON khớp với backend giả `DailyDesk_MVP/frontend/src/mocks/server.ts`; file đó là bản tham chiếu chạy được của contract này.

## Quy ước chung

- **Auth**: mọi route trừ `/auth/*` và `GET /health` cần `Authorization: Bearer <session token>`. Thiếu hoặc sai token → `401 { "message": "Bạn cần đăng nhập" }`.
- **Tách dữ liệu**: tài nguyên không thuộc người gọi → `404 { "message": "Không tìm thấy …" }`. Không dùng `403` cho trường hợp này. `403` chỉ dùng cho hành động cấm trên tài nguyên của chính mình (ví dụ xoá board mặc định).
- **Lỗi kiểm tra dữ liệu** → `400`:
  ```json
  { "message": "Dữ liệu chưa hợp lệ", "fields": { "name": "Hãy nhập tiêu đề cho task." } }
  ```
- **Lỗi khác** → `500 { "message": "Có lỗi xảy ra, vui lòng thử lại" }`. Không trả stack trace.
- **Thời gian**: chuỗi ISO 8601. **ID**: UUIDv7. Client có thể gửi `id` khi tạo.
- `{boardId}` trong đường dẫn phải là board của người gọi; `{cardId}` và `{listId}` phải nằm trong board đó.

### Kiểu Card (dùng trong nhiều response)

```json
{
  "id": "…", "name": "Nộp báo cáo", "description": null, "order": 0, "listId": "…",
  "priority": "high", "dueAt": "2026-11-04T10:00:00.000Z", "deadline": "2026-11-04T10:00:00.000Z",
  "startDate": null, "completed": false, "dueComplete": false,
  "coverColor": null, "coverUrl": null, "coverPublicId": null, "coverMode": null,
  "reminderMinutes": null, "recurrence": null, "recurrenceDay": null, "recurrenceWeekday": null,
  "repeatFrequency": null, "repeatInterval": null, "latitude": null, "longitude": null,
  "isTemplate": false, "createdAt": "…", "updatedAt": "…",
  "labels": [{ "id": "…", "name": "Học tập", "color": "#579dff" }],
  "members": [], "attachments": []
}
```

---

## Nhóm A, bắt buộc (P1–P2)

| Method | Path | Body | 2xx response | Ghi chú / lỗi |
|---|---|---|---|---|
| GET | `/health` | – | `200 { "ok": true }` | Không cần auth |
| POST | `/auth/google` | `{ "credential": "<Google ID token>" }` | `200 { "token", "user": { id, name, email, picture } }` | `401` nếu token sai, hết hạn, sai `aud` hoặc email chưa xác minh. Lần đầu tạo user + board mặc định |
| POST | `/auth/dev` | `{ "email", "name" }` | như trên | Chỉ có khi `AUTH_DEV_LOGIN=true`; nếu không thì `404` |
| GET | `/auth/me` | – | `200 { id, name, email, picture }` | |
| GET | `/boards` | – | `200 { "ownedBoards": Board[], "invitedBoards": [] }`; mỗi Board có `lists[].cards[]` | `invitedBoards` luôn rỗng (ngoài phạm vi) |
| POST | `/boards` | `{ id?, name, backgroundColor?, backgroundUrl? }` | `201 Board` | `name` 1–100 |
| GET | `/boards/cards/all` | – | `200 Card & { listName, boardId, boardName }[]` | Màn "Việc của tôi". **Phải khai báo trước `/boards/{id}`** |
| GET | `/boards/{id}` | – | `200 Board` có `lists[].cards[]` sắp theo `order` | |
| PUT | `/boards/{id}` | `{ name?, backgroundColor?, backgroundUrl? }` | `200 Board` | |
| DELETE | `/boards/{id}` | – | `200 { "message" }` | `403` nếu là board mặc định; cascade |
| GET | `/boards/{id}/lists` | – | `200 List[]` | `List = { id, name, order, boardId }` |
| GET | `/boards/{id}/cards` | – | `200 Card[]` | |
| POST | `/boards/{boardId}/lists` | `{ id?, name, order? }` | `201 List` | |
| GET / PUT / DELETE | `/boards/{boardId}/lists/{id}` | PUT: `{ name?, order? }` | `200 List` / `200 { message }` | DELETE cascade cards |
| POST | `/boards/{boardId}/cards` | `{ id?, name, description?, order?, listId, dueAt?\|deadline?, priority?, labels?: {id}[] , coverColor? }` | `201 Card` | Kiểm tra: tên 1–200, mô tả ≤ 2000, priority enum, hạn hợp lệ và không ở quá khứ; `listId` thuộc board |
| GET | `/boards/{boardId}/cards/{id}` | – | `200 Card` | |
| PUT | `/boards/{boardId}/cards/{id}` | mọi trường của POST (tuỳ chọn) + `listId?`, `completed?` | `200 Card` | Đổi `listId` = đổi trạng thái; server tự đặt `completed` theo list đích. Hạn ở quá khứ chỉ bị từ chối khi giá trị hạn **thay đổi** |
| DELETE | `/boards/{boardId}/cards/{id}` | – | `200 { message }` | Cascade |

### Ví dụ: tạo task không hợp lệ
```http
POST /boards/0193…/cards
Authorization: Bearer eyJ…
Content-Type: application/json

{ "name": "   ", "listId": "0193…", "dueAt": "2020-01-01T00:00:00Z" }
```
```json
400 { "message": "Dữ liệu chưa hợp lệ",
      "fields": { "name": "Hãy nhập tiêu đề cho task.", "dueAt": "Hạn chót phải từ bây giờ trở đi." } }
```

---

## Nhóm B, nên có (P3, cho hộp thoại chi tiết và tìm kiếm)

| Method | Path | Body | Response |
|---|---|---|---|
| PATCH | `/boards/{boardId}/cards/{cardId}/due` | `{ startDate?, dueAt?, dueComplete?, reminderMinutes?, repeatFrequency?, repeatInterval? }` | `200 { startDate, dueAt, dueComplete, reminderMinutes, repeatFrequency, repeatInterval }` |
| DELETE | `/boards/{boardId}/cards/{cardId}/due` | – | `200 { message }` (xoá mọi trường ngày) |
| GET / POST | `/boards/{boardId}/cards/{cardId}/checklist-items` | POST `{ id?, name, completed?, order }` | `200 Item[]` / `201 Item`; `Item = { id, name, completed, order, cardId, members: [] }` |
| GET / PUT / DELETE | `…/checklist-items/{id}` | PUT `{ name?, completed?, order? }` | `200 Item` / `200 { message }` |
| GET / POST | `/users/{userId}/labels` | POST `{ id?, name, color }` | `200 Label[]` / `201 Label`. `{userId}` bị bỏ qua: luôn là người gọi |
| PUT / DELETE | `/users/{userId}/labels/{id}` | PUT `{ name?, color? }` | `200 Label` / `200 { message }` |
| GET / POST | `/boards/{boardId}/cards/{cardId}/comments` | POST `{ content }` (1–5000) | `200 Comment[]` / `201 Comment`; `Comment = { id, cardId, userId, content, text, createdAt, user: { id, name, email, initials } }` |
| PUT / DELETE | `…/comments/{commentId}` | PUT `{ content }` | chỉ tác giả; không phải tác giả → `403` |
| GET | `/boards/{boardId}/cards/{cardId}/activities` | – | `200 Activity[]` |
| GET | `/boards/{boardId}/cards/{cardId}/timeline` | – | `200 (Comment & {type:"comment"} \| Activity & {type:"activity"})[]`, mới nhất trước |
| GET | `/search?q=&types=&boardId=&limit=` | – | `200 { results, total, query }`. Hỗ trợ `types` = `board`, `list`, `card`; bỏ dấu tiếng Việt khi so khớp |

## Nhóm C, ngoài phạm vi (không cài)

`/boards/{boardId}/members*`, `/members/search`, `…/attachments*`, `/media/image/*`, `/templates*`, `POST /boards/{boardId}/cards/from-template`.

Backend trả `404`. Khi `VITE_USE_MOCK=false`, frontend MUST ẩn các nút dẫn tới những route này qua cờ trong `src/lib/features.ts` (đã có `SHOW_COLLABORATION`; cần thêm `SHOW_TEMPLATES`, `SHOW_ATTACHMENTS`, `SHOW_COVER_UPLOAD`).

---

## Thay đổi cần ở frontend khi chuyển sang dữ liệu thật

1. `src/lib/auth.tsx`: thay phần giả lập bằng Google Identity Services, gọi `POST /auth/google`, lưu `token` và dùng làm `getAccessTokenSilently()`. Giữ nguyên API của hook.
2. `.env`: `VITE_USE_MOCK=false`, `VITE_BACKEND_URL=<url backend>`, `VITE_GOOGLE_CLIENT_ID=<client id>`.
3. `src/lib/features.ts`: thêm cờ của nhóm C, bật khi `USE_MOCK`, tắt khi chạy backend thật.
