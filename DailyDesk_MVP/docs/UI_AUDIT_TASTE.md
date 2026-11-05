# UI AUDIT — DailyDesk MVP (soi bằng `design-taste-frontend`, bộ quy tắc **app screens**)

Ngày: 2026-11-05 · Người soi: agent audit (chỉ đọc, không sửa file nào)
Căn cứ: `references/app-screens.md`, `references/tells.md`, `references/critique.md`, `references/type.md`
Bằng chứng: 7 ảnh trong `frontend/.impeccable/review/planner/` + mã nguồn `frontend/src/`
Ghi chú phạm vi: **không chạy browser, không chạy `inspect.mjs`**. Mọi số đo màu dưới đây tính trực tiếp từ token oklch trong `index.css`; mọi số đo pixel thật (overflow, reflow, focus ring, motion) nằm ở mục 6.

---

## 1. Nhận định tổng thể

1. Màn "Việc của tôi" (`list-light.jpg`) là màn duy nhất đã thực sự được thiết kế: mật độ đúng, cột cố định, nhóm theo hạn, một câu dữ liệu dưới tiêu đề. Đây là chuẩn, giữ nguyên.
2. Hướng "sổ kế hoạch giấy" **đúng** cho app này và **không nên đổi**: nó cho người dùng một ẩn dụ thao tác (tick ô, đóng dấu, lề đỏ) thay vì một dashboard, và "mực tím" là thứ chỉ học trò/dân văn phòng Việt mới có — nó qua được "competitor test" của skill.
3. Nhưng hướng đó mới làm **2/7 màn**. Commit `b6d4489` chỉ chạm 21 dòng ở `KanbanCard.tsx`, 4 dòng ở `card-header.tsx`, 2 dòng ở `month-view.tsx`. Board, hộp thoại thẻ và lịch vẫn là một bản Trello-shadcn cũ dán cạnh trang sổ.
4. Skill gọi đúng tình trạng này: *"làm hời hợt thì còn tệ hơn là làm phẳng dứt khoát"*. Hiện có đúng **một** chi tiết giấy (đường lề đỏ 1px) và **một** con dấu — không có kẻ dòng, không có bậc giấy, không có lề thật.
5. Sai lệch nặng nhất về màu không phải là "tím" mà là **tím dùng làm chrome**: bìa sổ là một khối tím đặc chiếm ~14–15% pixel màn hình, trong khi chuẩn app-screens là ~3% và 17/23 màn thật ở mức ≤5%.
6. Dark mode nhuộm tím cả nền (`--paper: oklch(0.22 0.015 290)`), đúng tell "navy/slate dark theme" mà skill cấm thẳng.
7. `DESIGN.md` đang mô tả một hệ thống **không còn tồn tại** (navy xanh lạnh, "không có display face", "không có typeface thứ hai"). Hợp đồng và mã đã ly hôn từ commit `b6d4489`.
8. Con dấu XONG xuất hiện trên **mọi** dòng Done (4 dấu đỏ liền nhau trong `list-dark-done.jpg`, 3 dấu trong `board.jpg`) → đỏ thành hoạ tiết, không còn là tín hiệu.
9. Tương phản về cơ bản **đạt**; chỉ 4 chỗ rớt, đều do xài opacity `/70`, `/80` chồng lên màu đã muted.
10. **Kết luận: giữ hướng, làm cho tới.** Việc cần làm theo thứ tự: trả tím về vai trò mực (dữ liệu + 1 nút), bìa sổ thành giấy, dark nền trung tính, kéo board + dialog + lịch về cùng một ngôn ngữ, rồi mới tới chi tiết.

---

## 2. Những "tell" trong `references/tells.md` mà app đang mắc

| # | Tell (mục trong tells.md) | Trạng thái | Bằng chứng |
|---|---|---|---|
| T1 | §1 "Violet / indigo" — **banned** | Mắc, nhưng có lý do chủ thể | `src/index.css:300` `--ink: oklch(0.38 0.13 292)` dùng làm `--primary`. Xem phân tích ở N1: giữ hue, bỏ cách dùng. |
| T2 | app-screens §14 "A dark or saturated sidebar on a light screen" (0/17 màn thật có) | Mắc | `src/index.css:328` `--sidebar: oklch(0.31 0.095 292)`; thấy ở `list-light.jpg`, `calendar.jpg`, `board.jpg` |
| T3 | app-screens §13 "a navy or slate dark theme" | Mắc | `src/index.css:350` `--paper: oklch(0.22 0.015 290)`, `:361 --card: oklch(0.25 0.017 290)` — hue 290 trên cả nền |
| T4 | §4 "Tiny uppercase letter-spaced captions" + app-screens §13 "Nothing under 11px" | Mắc 3 lỗi cùng lúc | `src/index.css:498-512` `.stamp`: `font-size: 0.625rem` (10px) + `letter-spacing: 0.1em` + chữ hoa + `opacity: 0.85` |
| T5 | §1 "Soft grey drop shadow under every card" / app-screens §9.4 "A border or a shadow, never both" | Mắc ở 5 chỗ | `tasks-page.tsx:609`; `components/kanban.tsx:752`; `ui/button.tsx:16` (`shadow-xs` trên mọi nút outline); `task-form-dialog.tsx:126` (shadow **và** `ring-1`); `app-sidebar.tsx:48` |
| T6 | §3 "Yellow-cream ground" — **warned** | Mắc ở mức cảnh báo | `--paper: oklch(0.978 0.01 85)` kem + `--red-ink` + dạ quang vàng. Chấp nhận được vì kem ở đây là "giấy", không phải trang trí — nhưng phải không được kèm thêm hue thứ 4, 5. |
| T7 | app-screens §14 "A rainbow palette, a hue per bar or per chart" | Mắc | `src/index.css:105-114` 10 hue `kanban-board-circle-*` còn sống; `components/due-badge.tsx:24-30` dùng thẳng `green-100/800`, `red-100/800`, `yellow-100/800`, `gray-100/800`; `calendar.jpg` có 4 màu chip cùng lúc |
| T8 | app-screens §14 "Placeholder people" | Mắc | `pages/kanban/Kanban.tsx:88` `"Owner"`, `:94` `"Board Owner"` |
| T9 | app-screens §14 "A top bar … or one left mostly empty" / §4.3 "actions only when they are real" | Mắc | `BoardHeaderBar.tsx:317-402`: 5 nút icon không nhãn + 1 thanh tiến độ không số, thấy ở góc phải `board.jpg` |
| T10 | §5 "Thin rules" / app-screens §13 "Dashed lines: in chart grids and empty slots only" | Mắc | `app-sidebar.tsx:55` `border-dashed`; `sign-in-screen.tsx:175` `border-dashed` |
| T11 | §1 "Glass panels: backdrop blur" | Mắc 1 chỗ | `card-edit-dialog/card-create-dialog.tsx:573` `backdrop-blur-sm` |
| T12 | §8 "Why removal is not enough" — bỏ trang trí mà không thay bằng ý tưởng | Mắc, là lỗi gốc | Board và card dialog đã gỡ hết màu cũ nhưng không nhận được gì của thế giới sổ giấy: `board.jpg` nửa dưới trống, `card-dialog.jpg` hai vùng trống |
| T13 | app-screens §11 "Red is a signal, not a texture" | Mắc | `tasks-page.tsx:300` + `KanbanCard.tsx:412`: dấu XONG trên **mọi** mục Done |
| T14 | §6 "Copy tells" (lint) | Mắc — tiếng Anh lọt UI | `BoardHeaderBar.tsx:349`, `:422-423`; `card-edit-dialog.tsx:1112`; `month-view.tsx:217` |

**Không mắc** (ghi lại để agent sau khỏi "sửa nhầm"): không gradient trên nền/nút/chữ (trừ 1 scrim ảnh bìa đã được ghi nhận là chức năng), không eyebrow/pill badge trên tiêu đề, không monospace giả kỹ thuật, không đánh số 01/02/03, không emoji, không icon trong ô vuông tô màu trên KPI, không sparkline, không zebra table, không KPI tile.

---

## 3. Danh sách lỗi — xếp theo thứ tự nên sửa

### CHẶN

---

**C1. `DESIGN.md` mô tả một hệ thống đã chết — mọi agent đọc nó sẽ sửa sai.**
*Màn:* toàn bộ. *File:* `frontend/DESIGN.md:4-31`, `:166-183`, `:227-230`, `:289-293`.
*Vì sao sai:* `git show --stat b6d4489` cho thấy commit đổi hướng **không chạm** `DESIGN.md`. Front-matter vẫn khai `paper: oklch(0.982 0.004 240)` (xám xanh lạnh) trong khi mã dùng `oklch(0.978 0.01 85)` (kem ấm); vẫn khai `navy`, `manila-panel`, `folder-tab`, `status-pill-*` — không token nào trong số đó còn tồn tại trong `index.css`. `DESIGN.md:227` ghi *"Display Font: none; the system has no display face"* và `:376` ghi *"Don't introduce a second typeface"*, trong khi `index.css:8` nạp Literata và `:421` định nghĩa `.font-planner` dùng nó cho H1.
*Cách sửa:* viết lại toàn bộ front-matter và 4 mục Colors / Typography / Shapes / Elevation từ `index.css:294-585` (xem mục 4 cho danh sách dòng). **Sửa cái này trước mọi thứ khác**, vì các lỗi dưới đây được định nghĩa so với nó.

---

**C2. Hướng "sổ kế hoạch giấy" mới áp cho 2/7 màn; 3 màn còn lại là một design system khác.**
*Màn:* Board (`board.jpg`), hộp thoại thẻ (`card-dialog.jpg`), Lịch (`calendar.jpg`).
*Bằng chứng:* đặt `list-light.jpg` cạnh `board.jpg` — khác font tiêu đề (Literata 32px vs 28px), khác cách đánh dấu xong (ô tick + dấu vs checkbox mờ), khác nút chính (có vs không), khác lề canvas (`lg:px-10` vs `p-4`), khác ngôn ngữ meta (cột cố định vs chip rời).
*Quy tắc:* critique.md pass 9 "Sameness" + app-screens §2.3 *"A style dealt to two products must not give them the same face"* — ở đây ngược lại: một sản phẩm, ba face.
*Cách sửa (thứ tự):*
1. `pages/kanban/BoardHeaderBar.tsx:174` — đổi `className="z-10 mb-4 flex items-center justify-between gap-3 border-b px-1 pt-2 pb-3"` thành cấu trúc title-row giống `tasks-page.tsx:517-546`: `<p>` ngày ở trên, `<h1 className="font-planner …">` tên board, một câu dữ liệu `{doneCards}/{totalCards} task đã xong · {overdue} quá hạn`, nút `Thêm task` ở phải.
2. `BoardHeaderBar.tsx:177` — đổi `text-[1.75rem]` → `text-[2rem] sm:text-[2.25rem]` cho khớp (và xem N5, nơi đề xuất hạ cả ba xuống 28px).
3. `pages/kanban/Kanban.tsx:617` — đổi `p-4 pt-5` → `mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 lg:px-10` cho bằng `tasks-page.tsx:516`.
4. Cột kanban: `components/kanban.tsx:470` thêm bậc giấy thay vì chỉ `bg-muted/70` — `bg-muted/70` → `bg-[color-mix(in_oklch,var(--card)_60%,var(--paper))]` để cột là "trang giấy mỏng hơn", card là `var(--card)`.

---

**C3. Board: hơn một nửa canvas là khoảng trống, và trên đó có một nút nổi.**
*Màn:* Board (`board.jpg` — cột kết thúc ở y≈310/480, dưới là trống).
*File:line:*
- `pages/kanban/KanbanColumn.tsx:84` — `className="max-h-full h-auto"` ép cột co theo nội dung.
- `pages/kanban/Kanban.tsx:678` — `className="pb-24 …"` cộng thêm 96px trống ở đáy.
- `pages/kanban/Kanban.tsx:640-659` — `fixed bottom-4 left-1/2 z-30 -translate-x-1/2` cho cụm "Kanban / Lịch".
*Vì sao sai:* app-screens §4.2 *"Dead space from a grid that does not fit the data is the commonest failure in the study"*; §3.4 house rule *"no floating button unless it is the screen's one primary action and covers nothing at any width"* — một nút chuyển view **không** phải primary action. Thêm nữa, trong `card-dialog.jpg` cụm nút này vẫn hiện sáng trong khi cả trang đã bị overlay làm tối → nó nằm trên overlay (cần xác nhận ở mục 6).
*Cách sửa:*
```tsx
// KanbanColumn.tsx:84
className="h-full"                       // bỏ max-h-full h-auto

// Kanban.tsx:678
className="pb-4 flex-1 overflow-x-auto overflow-y-auto items-stretch"   // items-start → items-stretch, pb-24 → pb-4

// Kanban.tsx:640-659 — xoá hẳn khối fixed, chuyển hai nút vào title row
// đặt cạnh nút "Thêm task" trong BoardHeaderBar, dùng đúng Segmented của app:
<div role="group" aria-label="Chế độ xem" className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-muted p-1">
  …  // mỗi nút h-7 px-3
</div>
```
Sau khi cột `h-full`, `AddCardForm` ("+ Thêm task") tự rơi xuống đáy cột — đó là footer action mà app-screens §4.2 yêu cầu cho card bị kéo cao.

---

**C4. Hộp thoại thẻ bị ép cao 640px bất kể nội dung → hai lỗ trống.**
*Màn:* card dialog (`card-dialog.jpg`: ~110px trống dưới "Việc con", ~250px trống ở cột bình luận).
*File:line:* `components/card-edit-dialog/card-edit-dialog.tsx:688-692`
```tsx
style={{ maxWidth: …, width: 'calc(100vw - 2rem)', height: isVertical ? 'min(85svh, 760px)' : 'min(640px, 90svh)' }}
```
*Vì sao sai:* app-screens §4.2 *"A stretched card stretches only when it has content to fill"*; inspector fail `panel-void` khi có dải trống >40px trong một panel.
*Cách sửa:*
```tsx
style={{
  maxWidth: isVertical ? '920px' : '1200px',
  width: 'calc(100vw - 2rem)',
  height: 'auto',
  maxHeight: isVertical ? 'min(85svh, 760px)' : 'min(640px, 90svh)',
}}
```
và ở `:750` đổi `className="flex-1 space-y-6 p-6 overflow-y-auto max-h-full overscroll-contain"` → bỏ `flex-1`, giữ `overflow-y-auto`, để hai cột tự cao theo nội dung. Cột phải (`:1086`) thêm `self-start` để không bị kéo bằng chiều cao cột trái.

---

**C5. Cùng một task có hai hộp thoại khác nhau và hai mô hình lưu khác nhau.**
*Màn:* Việc của tôi / Lịch dùng `features/tasks/task-form-dialog.tsx` (Huỷ + Lưu, validate, focus lỗi). Board dùng `components/card-edit-dialog/card-edit-dialog.tsx` (tự lưu từng trường, không footer).
*Vì sao sai:* app-screens §8.2 house rule *"One save model per view: every control saves itself …, or one Save per panel. Never a mix of both."* Ở đây mix giữa hai màn của cùng một object — người dùng mở task từ danh sách thì phải bấm Lưu, mở đúng task đó từ board thì không.
*Cách sửa (chọn 1, ghi vào DESIGN.md):*
- **Khuyến nghị:** dùng mô hình tự lưu cho cả hai (phù hợp app dùng hằng ngày). Đổi `task-form-dialog.tsx:368-385` footer thành một dòng trạng thái `Đã lưu lúc HH:mm` + nút ghost `Xoá task`, giữ nguyên validate nhưng chạy theo `onBlur` từng trường.
- Hoặc ngược lại: thêm footer `Huỷ / Lưu thay đổi` vào `card-edit-dialog.tsx` và gom các `onChange` lại thành một `localCard` chỉ gửi khi submit.
Dù chọn gì, hai dialog phải **cùng thứ tự trường**: Tiêu đề → Mô tả → Hạn chót → Độ ưu tiên → Trạng thái (hiện `card-dialog.jpg` đảo thành Trạng thái → Ưu tiên → Nhãn → Ngày → Mô tả).

---

**C6. Chuỗi tiếng Anh lọt ra giao diện của một app toàn tiếng Việt.**
*Quy tắc:* `DESIGN.md:370` — *"Do write all visible, toast, and screen-reader copy in Vietnamese"*; app-screens §2.5 inspector fail placeholder data.
| File:line | Hiện tại | Sửa thành |
|---|---|---|
| `pages/kanban/BoardHeaderBar.tsx:349` | `Create and manage labels for <b>{boardName}</b>` | `Tạo và quản lý nhãn cho <b>{boardName}</b>` |
| `pages/kanban/BoardHeaderBar.tsx:422-423` | `This action cannot be undone. All lists, cards, and data in this board will be permanently deleted.` | `Thao tác này không hoàn tác được. Mọi danh sách, task và dữ liệu trong board sẽ bị xoá vĩnh viễn.` |
| `components/card-edit-dialog/card-edit-dialog.tsx:1112` | `isSubmitting ? "Creating..." : "Create Card"` | `isSubmitting ? "Đang tạo…" : "Tạo task"` |
| `components/event-calendar/month-view.tsx:217` | `<span className="max-sm:sr-only">more</span>` | `<span className="max-sm:sr-only">việc nữa</span>` |
| `pages/kanban/Kanban.tsx:88` | `"Owner"` | `"Chủ board"` |
| `pages/kanban/Kanban.tsx:94` | `"Board Owner"` | `"Chủ board"` |

---

### NẶNG

---

**N1. Mực tím đang là *chrome*, không phải *mực*. Tỉ lệ màu ~15% so với chuẩn ~3%.**
*Màn:* mọi màn đã đăng nhập.
*File:line:* `src/index.css:328` `--sidebar: oklch(0.31 0.095 292)`; `:314` `--primary: var(--ink)`; `:341` `--status-done: var(--ink)`; `tasks-page.tsx:206` `done: "text-ink"`.
*Vì sao sai:* app-screens mở đầu — *"Colour goes on data, not chrome. The median screen has about 3% coloured pixels; 17 of 23 stay at 5% or less."* Bìa sổ tím đặc chiếm ~115×480px trên khung 800×480 của `list-light.jpg` ≈ **14.4%**, chưa tính nút "Thêm task". §14: *"A dark or saturated sidebar on a light screen"* → *"The sidebar on the page ground"*. Và §13 cấm *"The accent on chrome"*.
Thêm một nghịch lý ngữ nghĩa: `--status-done = --ink`, nên **Done** — trạng thái cần yên tĩnh nhất — lại được tô bằng màu nổi nhất của hệ thống (`list-dark-done.jpg`, cột "Trạng thái" tím).
*Giữ hue, đổi cách dùng.* Mực tím là màu lấy từ chủ thể (vở học trò Việt), nên theo `SKILL.md` §Special cases nó được giữ và khai báo `--allow` khi chạy inspector. Nhưng phải rút về đúng vai trò:
```css
/* index.css:327-335 — bìa sổ thành giấy, tím còn lại ở một vạch gáy */
--sidebar: oklch(0.962 0.012 85);                 /* cùng họ giấy, tối hơn trang 1 bậc */
--sidebar-foreground: oklch(0.28 0.015 285);      /* chữ than chì */
--sidebar-accent: oklch(0.935 0.018 85);          /* hover */
--sidebar-accent-foreground: oklch(0.22 0.012 285);
--sidebar-primary: var(--ink);                    /* chỉ dùng cho mục đang mở */
--sidebar-primary-foreground: oklch(0.99 0.005 85);
--sidebar-border: oklch(0.9 0.018 80);
```
Và ở `components/ui/sidebar.tsx` (hoặc `app-sidebar.tsx:42`) thêm vào `<Sidebar>` một vạch gáy tím 4px:
`className="border-r-0 shadow-[inset_-4px_0_0_var(--ink)]"` — đó là "gáy sổ", 4px thay vì 115px.
Mục nav đang mở (`app-sidebar.tsx:28`) đổi từ `data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground` → `data-[active=true]:bg-sidebar-accent data-[active=true]:text-ink data-[active=true]:shadow-[inset_3px_0_0_var(--ink)]` (pill xám + vạch mực, đúng §3.2).
`index.css:341` đổi `--status-done: var(--ink)` → `--status-done: oklch(0.45 0.03 285)` (than chì nhạt) để Done là trạng thái yên nhất.

---

**N2. Dark mode nhuộm tím cả nền — đúng tell "navy/slate dark".**
*File:line:* `src/index.css:350` `--paper: oklch(0.22 0.015 290)`; `:361` `--card: oklch(0.25 0.017 290)`; `:363` `--popover: oklch(0.27 0.018 290)`; `:369-375` muted/secondary/input đều hue 290.
*Vì sao sai:* app-screens §9.3 — *"Ground: #000 (3), #111 (2), #171719 (1). **No navy and no slate.**"* §13 cấm thẳng *"a navy or slate dark theme"* → *"True neutral darks"*.
*Cách sửa:* bỏ chroma khỏi nền, giữ tím **chỉ** ở mực:
```css
.dark {
  --paper:   oklch(0.17 0 0);     /* ~#111 */
  --rule:    oklch(0.27 0 0);
  --card:    oklch(0.21 0 0);
  --popover: oklch(0.23 0 0);
  --secondary: oklch(0.26 0 0);
  --muted:     oklch(0.25 0 0);
  --input:     oklch(0.33 0 0);
  --ink: oklch(0.8 0.1 292);      /* giữ nguyên — mực vẫn tím */
  /* --foreground giữ oklch(0.93 0.01 85), hơi ấm cho "giấy ngà" là hợp lý */
}
```
Đồng thời `--sidebar: oklch(0.19 0.04 292)` (`:377`) → `oklch(0.15 0 0)` và áp lại vạch gáy tím như N1.

---

**N3. Con dấu XONG: lặp trên mọi dòng, 10px chữ hoa giãn chữ, 4.28:1, và là dấu thừa thứ tư.**
*Màn:* `list-dark-done.jpg` (4 dấu liên tiếp), `board.jpg` (3 dấu), `signin.jpg`.
*File:line:* `src/index.css:497-512`; `tasks-page.tsx:300`; `pages/kanban/KanbanCard.tsx:412`; `sign-in-screen.tsx:71`.
*Bốn lỗi chồng nhau:*
1. app-screens §11 — *"Red is a signal, not a texture: one red mark per object at most"*. Hiện là một dấu đỏ trên mọi object Done.
2. app-screens §7.6 — *"One status mark per row"*. Dòng Done đã có: ô tick đã tô, chữ gạch ngang, nhãn "Done", chữ mờ đi. Dấu là mark thứ **năm** nói cùng một điều.
3. §13 — *"Nothing under 11px"*: `font-size: 0.625rem` = 10px.
4. tells §4 — nhãn hoa nhỏ giãn chữ: `letter-spacing: 0.1em` + `XONG` + `font-weight: 700`.
5. Tương phản: `--red-ink` ở `opacity: 0.85` trên `--card` = **4.28:1** < 4.5 (tính từ token).
*Cách sửa — giữ khoảnh khắc, bỏ hoạ tiết:* dấu chỉ đóng **một lần, lúc vừa tick**, rồi biến mất; dòng Done ở trạng thái nghỉ chỉ còn ô tick + gạch ngang.
```tsx
// tasks-page.tsx:300 — chỉ hiện khi dòng đang flash
{done && flash && <span className="stamp stamp-press shrink-0">XONG</span>}
// KanbanCard.tsx:412 — bỏ hẳn, hoặc gắn vào cùng cờ "vừa đổi"
```
```css
/* index.css:498-512 */
.stamp{
  font-size: 0.6875rem;        /* 11px — sàn của skill */
  letter-spacing: 0.06em;
  opacity: 1;                  /* 5.44:1 */
  /* giữ nguyên border 1.5px, rotate(-6deg) */
}
```

---

**N4. Border + shadow cùng lúc trên 5 loại bề mặt đứng yên.**
*Quy tắc:* app-screens §9.4 — *"A border or a shadow, never both"*; `DESIGN.md:287` "The One Drawer Rule".
| File:line | Hiện tại | Sửa |
|---|---|---|
| `tasks-page.tsx:609` | `rounded-md border shadow-[0_1px_2px…,0_12px_28px…]` | giữ shadow (đây là "ngăn kéo", 1 bóng/màn) → bỏ `border`, thay bằng bậc nền: `bg-card` đã sáng hơn `--paper` |
| `components/kanban.tsx:752` | `rounded-lg border border-border bg-background p-3 … shadow-sm` | bỏ `shadow-sm`, giữ border |
| `components/ui/button.tsx:16` | `outline: "border bg-background shadow-xs …"` | bỏ `shadow-xs` — nó rơi lên **mọi** nút outline của app |
| `features/tasks/task-form-dialog.tsx:126` | `shadow-[0_1px_2px…] ring-1 ring-ink/40` | giữ `ring-1 ring-ink/40`, bỏ shadow |
| `components/app-sidebar.tsx:48` | `shadow-[0_1px_0_oklch(0_0_0/0.15)]` | bỏ (nhãn vở không nổi) |
Sau khi sửa, cả app còn đúng **một** resting shadow: ngăn kéo ở `tasks-page.tsx:609`.

---

**N5. Bốn màn, bốn lề canvas, ba cỡ H1 — khung nhảy khi đổi tab.**
| Màn | File:line | Lề hiện tại | H1 hiện tại |
|---|---|---|---|
| Việc của tôi | `tasks-page.tsx:516`, `:520` | `px-4 pt-8 pb-16 sm:px-6 lg:px-10` | `text-[2rem] sm:text-[2.25rem]` = 32/36px |
| Lịch | `pages/tasks.tsx:138`, `:140` | `px-4 pt-6 pb-16 sm:px-6 lg:px-8` | 32/36px |
| Board (danh sách) | `Home.tsx:192`, `:196` | `px-4 pt-6 pb-20 sm:px-6 lg:px-8` | 32/36px |
| Board (kanban) | `Kanban.tsx:617`, `BoardHeaderBar.tsx:177` | `p-4 pt-5` | `text-[1.75rem]` = 28px |
*Vì sao sai:* app-screens §4.2 — *"The strongest screens run a single left edge from the header to the last row"*; §9.1 — *"App type is not display type. The h1 stays at 18-32px"*, inspector cảnh báo **từ 34px**. 36px đang vượt.
*Cách sửa:* một class dùng chung cho cả bốn:
```tsx
// dùng ở cả 4 file
<div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 lg:px-10">
<h1 className="font-planner text-[1.75rem] leading-tight font-semibold">   // 28px, đúng dải app
```

---

**N6. Trạng thái "đang tải" không có hình dạng của trạng thái "đã tải".**
*File:line:*
- `pages/tasks.tsx:156` — `className="h-[32rem] animate-pulse rounded-xl border bg-card"`: một khối xám 512px thay cho cả lịch tháng.
- `tasks-page.tsx:366-378` — `SkeletonRows`: `py-4` + `gap-4`, 3 thanh; hàng thật là `py-2.5 lg:py-2.5` + 6 cột (`tasks-page.tsx:275`, `:251`). Layout nhảy khi data về.
*Quy tắc:* app-screens §11 Loading — *"the final layout with each value replaced by a flat grey bar at its real size (a 24px value gets a 24px-tall bar; rows keep their pitch), labels and headers shown at once, no shimmer gradient, and no shift of the layout when the data lands."*
*Cách sửa:*
```tsx
// pages/tasks.tsx:156 — vẽ khung lịch thật, ô trống
<div aria-busy="true" aria-label="Đang tải lịch" className="rounded-md border bg-card">
  <div className="grid grid-cols-7 border-b">{weekdays.map(d => <div key={d} className="py-2 text-center text-sm text-muted-foreground">{d}</div>)}</div>
  <div className="grid grid-cols-7">{Array.from({length:35}).map((_,i)=>(
    <div key={i} className="h-24 border-r border-b last:border-r-0 p-1">
      <div className="size-6 rounded-full bg-muted" />
    </div>))}</div>
</div>

// tasks-page.tsx:366-378 — khớp pitch và số cột của TaskRow
<li className={cn("grid items-center gap-x-3 px-4 py-2.5 sm:px-5", showBoard ? ROW_COLS_BOARD : ROW_COLS)}>
  <span className="size-5 rounded bg-muted" />
  <span className="ml-4 h-[15px] rounded bg-muted" style={{width:`${70-i*8}%`}} />
  <span className="hidden h-[13px] w-12 rounded bg-muted lg:block" />
  …  // một thanh cho mỗi cột, đúng chiều cao chữ của cột đó
</li>
```
Bỏ `animate-pulse` (skill: *"no shimmer gradient"*); dùng `bg-muted` tĩnh.

---

**N7. Dòng thứ hai dưới H1 đang hướng dẫn cách dùng giao diện, không nói về dữ liệu.**
*File:line:*
- `pages/tasks.tsx:141-142` — `"Bấm vào task để sửa hoặc đổi hạn, bấm vào ô ngày để thêm task."`
- `tasks-page.tsx:704-706` — `"Hiển thị {n}/{m} task · Bấm vào một dòng để sửa, bấm ô vuông để đánh dấu xong"`
*Quy tắc:* app-screens §4.3 — *"An optional second line: one 14-16px grey sentence about the data or the object (the finding, the period, the scope), **never about the interface** ('the filters narrow every block…', 'this page shows…' read as instructions, not a product)."* Và `SKILL.md` §Components — *"When a control seems to need a sentence on how to operate it, redesign the control instead of adding the sentence."*
*Cách sửa:*
```tsx
// pages/tasks.tsx:141 — thay bằng "finding" của màn
<p className="mt-1 text-sm text-muted-foreground">
  {monthOverdue > 0
    ? <>Tháng này có <button className="font-medium text-overdue …">{monthOverdue} việc quá hạn</button>.</>
    : "Không có việc nào quá hạn trong tháng này."}
  {undated > 0 && <> {undated} task chưa có hạn không hiện trên lịch.</>}
</p>

// tasks-page.tsx:704 — giữ phần số, bỏ phần dạy cách bấm
<p className="mt-3 px-1 text-xs text-muted-foreground tabular">Hiển thị {visible.length}/{tasks.length} task</p>
```
Cách bấm đã được ô tick và `aria-label` ở `tasks-page.tsx:188` nói rồi.

---

**N8. Bốn chỗ tương phản rớt dưới 4.5:1, tất cả do chồng opacity lên màu đã muted.**
Số liệu tính từ token (sRGB, WCAG 2.1):
| Chỗ | File:line | Tỉ lệ | Sửa |
|---|---|---|---|
| Đầu cột thứ trong lịch + ngày ngoài tháng | `month-view.tsx:92` `text-muted-foreground/70`, `:128` `data-outside-cell:text-muted-foreground/70` | **3.34:1** | bỏ `/70` → `text-muted-foreground` (6.72:1) |
| Placeholder ô nhập | `task-form-dialog.tsx:95` `placeholder:text-muted-foreground/80` | **4.16:1** | bỏ `/80` |
| Dấu XONG | `index.css:512` `opacity: 0.85` | **4.28:1** | `opacity: 1` (5.44:1) — xem N3 |
| Dark: cùng hai chỗ trên | `month-view.tsx:92`, `:128` | **4.13:1** | như trên |
*Đã đạt, đừng đụng:* `muted-foreground` trên card 6.72:1 · `status-doing` 5.99:1 · `overdue` 5.44:1 · foreground 16.15:1 · trắng trên nút mực 10.26:1 · chữ trên dạ quang 11.26 / 13.47:1 · chữ bìa sổ 6.19–11.01:1 · dark muted 6.93:1 · dark red-ink 6.06:1. Viền 1.32:1 (light) / 1.26:1 (dark) nằm đúng dải 1.1–1.3:1 skill cho phép.

---

**N9. `BoardHeaderBar`: ô tìm cao 20px, nút icon 16px, thanh tiến độ không nhãn, không `aria-label`.**
*Màn:* Board (`board.jpg`, cụm góc phải).
| File:line | Vấn đề | Quy tắc | Sửa |
|---|---|---|---|
| `BoardHeaderBar.tsx:302` | `h-5 w-20 md:w-40 … text-xs` | §4.4 *"Control height in title and filter rows: 28-40px, median 34"*; `DESIGN.md:339` tối thiểu 32px | `h-9 w-40 md:w-56 … text-sm` |
| `BoardHeaderBar.tsx:308-312` | nút xoá từ khoá `h-4 w-4`, icon `h-2.5 w-2.5` (10px) | §9.4 *"inline icons 12-14px"*; `DESIGN.md:339` | `size-6` với icon `size-3.5` |
| `BoardHeaderBar.tsx:334-341, 367-374` | nút icon chỉ có `TooltipContent`, **không** `aria-label` | `DESIGN.md:369` *"Do give every icon-only button an aria-label in Vietnamese"* | thêm `aria-label="Nhãn"`, `aria-label="Thêm"` v.v. |
| `BoardHeaderBar.tsx:247-259` | `role="progressbar"` 56×6px, giá trị **chỉ** có trong tooltip; khi `SHOW_COLLABORATION` tắt thì hàng avatar ẩn, còn trơ một vạch mồ côi (đúng như `board.jpg`) | §6.1 *"A progress bar, both ends labelled"*; `DESIGN.md:379` cấm progress bar trên thẻ | thay bằng chữ có số: `<p className="text-sm text-muted-foreground tabular">{doneCards}/{totalCards} xong</p>`, đặt vào câu dưới H1 (xem C2) |

---

**N10. `due-badge.tsx` dùng thẳng bảng màu Tailwind, ngoài hệ token.**
*File:line:* `components/due-badge.tsx:24-30` — `bg-green-100 text-green-800 … dark:bg-green-900`, tương tự red / yellow / gray.
*Vì sao sai:* bốn hue lạ vào một màn đã có mực tím + đỏ + dạ quang → app-screens §6.4 *"The inspector warns over four hues and fails over six"*; §13 cấm *"Every row a different hue"*. Và `DESIGN.md:374` cấm mượn hue trạng thái cho thứ khác.
*Cách sửa:*
```tsx
const getBadgeClassName = () => {
  switch (color) {
    case "success":     return "bg-muted text-muted-foreground";                    // đã xong = yên nhất
    case "destructive": return "bg-[color-mix(in_oklch,var(--red-ink)_12%,transparent)] text-overdue ring-1 ring-inset ring-[color-mix(in_oklch,var(--red-ink)_40%,transparent)]";
    case "warning":     return "bg-status-doing-soft text-status-doing";
    case "secondary":   return "bg-muted text-muted-foreground";
    default:            return "";
  }
};
```

---

### VỪA

---

**V1. Segmented control kéo full-width → đọc như thanh tiến độ.**
`features/tasks/task-form-dialog.tsx:111` — `grid auto-cols-fr grid-flow-col` trong dialog `sm:max-w-lg` (512px) cho ra 3 ô rộng ~145px mỗi ô. app-screens §4.4: *"A segmented control is as wide as its options, and full width only below about 480px: three options spread across a 680px tablet card read as a progress bar."* Thấy rõ ở `card-dialog.jpg` (hàng "Trạng thái" và "Độ ưu tiên").
Sửa: `className="inline-grid auto-cols-max grid-flow-col gap-1 rounded-md border border-input bg-muted p-1 sm:max-[480px]:grid sm:max-[480px]:auto-cols-fr"` và mỗi option `px-4`.

**V2. Lịch: hôm nay là một đĩa tím đặc — mặc định của mọi lịch sinh ra bởi máy.**
`components/event-calendar/month-view.tsx:142` — `rounded-full size-6 group-data-today:bg-primary group-data-today:text-primary-foreground`. app-screens §"Calendars and timelines": *"today marked by a 1px line in the one data hue with its date in ink"*.
Sửa: `className="mt-1 inline-flex size-6 items-center justify-center text-sm group-data-today:font-semibold group-data-today:text-ink"` và thêm vào ô ngày (`:128`) `data-today:shadow-[inset_0_2px_0_var(--ink)]`.

**V3. Lịch: 4 màu chip cho 4 trạng thái → không màu nào nổi lên.**
`pages/tasks.tsx:26-31` map done→emerald, overdue→rose, doing→amber, todo→sky; `components/event-calendar/utils.ts:50-68` dịch ra 4 nền. app-screens §11: *"Full colour is only for what needs a decision."*
Sửa: Done = không nền, chữ mờ + gạch ngang; Todo = `bg-muted`; chỉ Doing (hổ phách) và Quá hạn (đỏ) mới có nền màu.
```ts
// event-item.tsx:17-18
const doneEventClasses = "bg-transparent text-muted-foreground line-through decoration-muted-foreground/60";
// utils.ts:58-59  case "violet"/"emerald" → "bg-transparent text-muted-foreground"
```
Lưu ý `emerald` hiện là nhánh chết: `event-item.tsx:72` đã ưu tiên `event.isDone`.

**V4. Cột "Hạn chót" căn trái, không có mép phải chung.**
`tasks-page.tsx:325-338` và header `:621`. app-screens §7.4: *"Numbers right-aligned, in tabular figures"*, *"One right edge per row or card"*. Ngày là thứ người dùng so sánh dọc theo cột.
Sửa: thêm `text-right` cho cả `<span>` ở `:621` và khối ở `:325`; dòng "Trễ …" (`:330`) cũng `text-right`. Cột `9.5rem` giữ nguyên.

**V5. `cursor-grab` là con trỏ mặc định trên mọi thẻ board — đúng thứ `DESIGN.md:341` cấm.**
`components/kanban.tsx:772` — `inline-flex w-full cursor-grab touch-manipulation …`.
`DESIGN.md:341`: *"the default cursor on a working surface is never a grab hand."*
Sửa: `cursor-grab` → `cursor-pointer`, và thêm `data-dragging:cursor-grabbing`.

**V6. Ô tick "xong" trên thẻ board mờ 60% cho tới khi hover.**
`pages/kanban/KanbanCard.tsx:279`, `:331`, `:381` — `opacity-60 group-hover:opacity-100`.
`DESIGN.md:343` "The Visible Action Rule": *"No action lives only behind hover."* Đây là thao tác chính của màn.
Sửa: bỏ `opacity-60 group-hover:opacity-100`, giữ `transition-colors`.

**V7. Literata có ba việc khác nhau và không nhất quán trong cùng một trang.**
`index.css:421` `.font-planner` được dùng cho: H1 trang (`tasks-page.tsx:520`), tiêu đề nhóm ngày (`:674`), tiêu đề empty state (`:385`), logo sidebar (`app-sidebar.tsx:52`), tên board (`board-card.tsx:70`), H1 board (`BoardHeaderBar.tsx:177`). Nhưng trong `Home.tsx`, h2 ở `:226`, `:341`, `:402` là **sans** còn h2 ở `:265` là **serif** — cùng cấp, khác mặt chữ.
`type.md` §6: *"Give each a job and never swap them."*
Sửa: chọn một việc — **Literata chỉ dành cho H1 của màn và tiêu đề nhóm ngày trong danh sách**. Gỡ `font-planner` khỏi `app-sidebar.tsx:52`, `board-card.tsx:70`, `tasks-page.tsx:385`, `Home.tsx:265`.

**V8. Ba chỗ chữ 10px, dưới sàn 11px của skill.**
`components/event-calendar/month-view.tsx:211` `text-[10px]`; `pages/kanban/KanbanCard.tsx:262`, `:319`, `:370` `text-[10px]`.
app-screens §13: *"Meta and axis text 11-12px. Nothing under 11px."*
Sửa: `text-[10px]` → `text-[11px]` ở cả bốn chỗ.

**V9. Đường lề đỏ — thiết bị "giấy" duy nhất — lệch khỏi cột chữ ở breakpoint `sm`.**
`index.css:432-447`: `left: 3rem` (48px), `@media (min-width:640px) left: 3.5rem` (56px).
Cột chữ của hàng: `tasks-page.tsx:275` `px-4 sm:px-5` + cột 1 `1.25rem` + `gap-x-3` → mép cột 2 ở 48px (base) và **52px** (sm). Nghĩa là ở `sm` đường lề cắt **vào trong** ô tiêu đề 4px. Tiêu đề nhóm (`:674`) lại ở `pl-[3.75rem]`/`sm:pl-[4.25rem]` = 60/68px.
Ở `sign-in-screen.tsx:59` ngày là `pl-16` (64px) còn tiêu đề việc là 16+20+12+20 = **68px** — lệch 4px, nhìn thấy trong `signin.jpg`.
Sửa: khoá một biến duy nhất và dùng khắp nơi:
```css
/* index.css */
:root { --planner-margin: 3rem; }
@media (min-width:640px){ :root { --planner-margin: 3.25rem; } }
.planner-page::before { left: var(--planner-margin); }
```
rồi đặt cột 2 bắt đầu đúng tại `var(--planner-margin)` (chỉnh `gap-x-3`→`gap-x-2` ở `sm`, hoặc `px-5`→`px-4` ở `sm`), và đổi `pl-[3.75rem] sm:pl-[4.25rem]` ở `:674` thành `pl-[calc(var(--planner-margin)+0.75rem)]`. Ở `sign-in-screen.tsx:59` đổi `pl-16` → `pl-[4.25rem]`.

**V10. Hàng meta của thẻ board thụt 24px, không khớp với tiêu đề.**
`pages/kanban/KanbanCard.tsx:413` — `<DateRow className="text-muted-foreground px-6" />` trong thẻ `p-3`. Tiêu đề bắt đầu sau ô tick 20px + `gap-2` 8px = 28px; meta ở 24px.
Sửa: `px-6` → `pl-7` (28px) ở cả `DateRow` và `PriorityMark`.

**V11. Chớp sáng khi tải trang ở chế độ tối.**
`components/theme-provider.tsx:36-50` gắn class `.dark` trong `useEffect`, và `index.html` không có script chặn. Người dùng dark thấy nền kem loé lên mỗi lần F5.
Sửa: thêm vào `index.html` trước `<div id="root">`:
```html
<script>try{var t=localStorage.getItem('vite-ui-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){}</script>
```
Nhân tiện đổi `storageKey = "vite-ui-theme"` (`theme-provider.tsx:28`) → `"dailydesk-theme"`.

**V12. Lưới board 4 cột với 1 board → 3 ô mồ côi.**
`Home.tsx:230`, `:282`, `:360` — `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` cố định. app-screens §4.2: *"Choose the column count from the number of items."*
Sửa: `className={cn("grid gap-4", boards.length === 1 ? "max-w-sm" : boards.length === 2 ? "sm:grid-cols-2 max-w-2xl" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}`.

**V13. Mũi tên của `<select>` là một SVG mã cứng `#667085` — không đổi theo dark mode.**
`features/tasks/task-form-dialog.tsx:350` — `stroke=%22%23667085%22` nhúng trong `bg-[url('data:image/svg+xml…')]`.
Sửa: thay bằng `stroke=%22currentColor%22` và thêm `text-muted-foreground`, hoặc dùng `<ChevronDown>` tuyệt đối như `SelectPill` (`tasks-page.tsx:168`) đã làm.

**V14. `index.css` có hai khối `:root` và hai khối `.dark` chồng nhau; ~60 token chết.**
`index.css:72-115` (`:root` shadcn mặc định) và `:297-347` (`:root` sổ giấy) — khối sau đè khối trước. Tương tự `.dark` ở `:117-159` và `:349-396`. `--radius` khai hai lần (`:73` `0.625rem`, `:298` `0.375rem`). `--chart-1..5` (`:92-96`, `:136-140`) và 10 token `--kanban-board-circle-*` (`:105-114`, `:149-158`) không màn nào dùng tới nữa — nhưng chính chúng là cái inspector sẽ đếm là "rainbow palette".
Sửa: xoá `:72-159` hoàn toàn, giữ `:297-396`; gỡ `--chart-*`, `--kanban-board-circle-*` khỏi cả `@theme inline` (`:46-49`, `:59-69`) và `@layer base` (`:168-180`). Gỡ luôn khối `::-webkit-scrollbar` trùng lặp (`:192-262` trùng `:409-412`).

**V15. "Todo / Doing / Done" là tiếng Anh, và trái với chính direction contract.**
`features/tasks/api.ts:37` — `{ todo: "Todo", doing: "Doing", done: "Done" }`.
`.impeccable/surfaces/src-features-tasks-tasks-page-tsx.md` khai FIRST VIEWPORT là *"Text tabs Tất cả · **Cần làm · Đang làm · Đã xong**"*. Mã shipping không khớp hợp đồng của chính nó.
app-screens §"Words of the trade": *"Words of the trade in labels …, never the generic noun of a template."*
Sửa (một dòng): `{ todo: "Cần làm", doing: "Đang làm", done: "Xong" }` — và kiểm `statusFromList()` (`api.ts:131` dùng `STATUS_LABEL[status]` để **đặt tên list** khi tạo) có còn nhận diện đúng list cũ tên "Done" không. Nếu rủi ro, giữ nguyên nhưng **ghi vào DESIGN.md** rằng đây là quyết định có chủ ý và sửa lại `surfaces/*.md`.

---

### NHỎ

- **S1.** `Layout.tsx:15` `h-screen` → `h-dvh`; trên Safari/Chrome mobile thanh công cụ động cắt mất đáy. `access-token-provider.tsx:58`, `:76` tương tự.
- **S2.** `index.css:423` `font-optical-sizing: auto` vô tác dụng: `main.tsx:6-7` nạp Literata bản tĩnh 500/600, không phải variable. Bỏ dòng đó hoặc đổi sang `@fontsource-variable/literata`.
- **S3.** `task-form-dialog.tsx:258`, `:274` — hint "Không bắt buộc" lặp trên hai trường liền nhau; `DESIGN.md:380` cấm lặp hint. Giữ một, hoặc đổi thành số ký tự.
- **S4.** `app-sidebar.tsx:55` và `sign-in-screen.tsx:175` dùng `border-dashed` ngoài phạm vi skill cho phép (chỉ lưới biểu đồ và ô trống). Đổi sang `border-solid border-current/20`.
- **S5.** `card-edit-dialog/card-create-dialog.tsx:573` `backdrop-blur-sm` — glass, bị cấm. Đổi thành `bg-background/90` đặc.
- **S6.** `components/theme-toggle.tsx` và `components/user-menu.tsx` trùng chức năng với `app-sidebar.tsx:118-136` và `:100-117`. `theme-toggle` chỉ còn dùng ở `sign-in-screen.tsx:140`; `user-menu` có vẻ không còn ai gọi. Kiểm rồi xoá bớt để chỉ còn một nguồn.
- **S7.** `BoardHeaderBar.tsx:211` `border-black/30 ring-2 ring-transparent group-hover:ring-white/30` và `:223` `bg-amber-400 text-amber-950 ring-2 ring-black/40` — tàn dư từ thời board có ảnh nền tối; trên giấy kem nó nặng và lạc token.
- **S8.** `pages/tasks.tsx:542` tooltip `title="Phím tắt: N"` thay cho `<kbd>` mà `DESIGN.md:267` mô tả — hint nằm trong tooltip thì bàn phím và touch không thấy.
- **S9.** `sign-in-screen.tsx:145` H1 36/41.6px trong cột `max-w-sm` (384px) trên nửa màn 720px → `signin.jpg` có khoảng trống lớn bên dưới và bên phải. Đây là **trang**, không phải app screen, nên critique.md cap áp dụng: *"a section huddled on one side with the other half empty: design cannot exceed 6.5"*. Nâng `max-w-sm` → `max-w-md` và đẩy nội dung lên (`items-center` → `justify-center` với padding trên nhỏ hơn).

---

## 4. Chỗ `DESIGN.md` tự sai

| Dòng | Hiện ghi | Phải sửa thành |
|---|---|---|
| `4-31` (front-matter `colors`) | 28 token navy / manila / cool-paper | Chép lại từ `index.css:297-347`: `paper`, `rule`, `ink`, `ink-soft`, `red-ink`, `margin-rule`, `hl-high`, `hl-medium`, `status-*`, `prio-*`, `overdue` |
| `32-65` (`typography`) | chỉ Be Vietnam Pro | Thêm vai trò `planner-heading` = Literata (xem V7 để giới hạn còn 2 việc) |
| `93-121` (`folder-tab`, `status-pill-*`) | tab hồ sơ + pill 5.5rem | Không còn tồn tại. Thay bằng `planner-tab` (`index.css:536-539`) và `status-box` (`index.css:463-495`) |
| `166-174` (North Star "The Office File Folder") | tủ hồ sơ, giấy xanh lạnh, mực navy | Viết lại theo `surfaces/*.md`: sổ kế hoạch giấy, giấy ấm, mực tím, lề đỏ, dấu XONG |
| `216` | dark theme "deep navy ground oklch(0.2 0.018 258)" | Sai cả giá trị lẫn hướng. Sau N2: `oklch(0.17 0 0)` trung tính |
| `219` "The Three Tabs Rule" (xanh/hổ phách/lục = Todo/Doing/Done) | Lục đã biến mất; `index.css:341` `--status-done: var(--ink)` | Viết lại: Todo = than chì, Doing = hổ phách, Done = than chì nhạt + ô tick. **Chỉ quá hạn mới được đỏ.** |
| `223` "The Square Means Priority Rule" (ô vuông 10px) | Không còn ô vuông; ưu tiên giờ là vệt dạ quang (`index.css:450-461`) | Viết lại: ưu tiên = vệt dạ quang, trạng thái = ô tick |
| `227` "Display Font: none" | Sai | "Planner heading: Literata 600, dùng cho H1 màn và tiêu đề nhóm ngày" |
| `280-284` (Shadow Vocabulary) | 5 loại bóng | Sau N4 còn đúng 1: ngăn kéo. Ghi rõ "A border or a shadow, never both" |
| `291` "0.5rem base … 12px cho drawer và board card" | `--radius` giờ là `0.375rem` (`index.css:298`) | 6px cho mọi thứ; 4px cho chip nhỏ. Theo app-screens §9.4 radius phải bimodal — chọn dải "tight 4-8" và nói rõ |
| `293` "mỗi board card mang một tab 64×10px" | Không còn trong `KanbanCard.tsx` | Xoá |
| `376` "Don't introduce a second typeface" | Mâu thuẫn với chính mã | Đổi thành "Hai mặt chữ, mỗi mặt một việc; không thêm mặt thứ ba" |
| `379` "Don't put … progress bars on task rows or board cards" | Đúng về luật, nhưng `BoardHeaderBar.tsx:247` vẫn có một cái | Giữ luật, thêm vào Known Drift hoặc sửa mã theo N9 |
| `384-392` (Known Drift) | "13 items … đã sửa cùng ngày" | Viết lại hoàn toàn: drift thật bây giờ là 3 màn chưa đổi hướng (C2) |
| **Thiếu hẳn** | — | Thêm mục **"Mực tím là màu của chủ thể"**: giải thích vì sao hue 292 được giữ dù skill cấm violet, và ghi rằng khi chạy `inspect.mjs --app` phải truyền `--allow` cho luật đó. Thêm mục **"Ngân sách màu"**: ≤5% pixel có màu, mực tím chỉ ở dữ liệu + một control |

---

## 5. Những gì KHÔNG nên đổi

1. **Toàn bộ bố cục và mật độ của `tasks-page.tsx`** (`:251-252` lưới cột, `:275` padding hàng, `:609-623` ngăn kéo + header cột). Đây là màn duy nhất đạt chuẩn app-screens; mọi màn khác phải chạy theo nó, không phải ngược lại.
2. **Câu dữ liệu dưới H1 ở `tasks-page.tsx:521-540`** — `"6 việc chưa xong · 1 việc quá hạn"` với số quá hạn là một nút đổi bộ lọc. Đây đúng là "the finding, next to the action it drives" mà app-screens §2.2 đòi. Giữ nguyên, và nhân rộng sang Lịch/Board.
3. **Vệt dạ quang cho ưu tiên** (`index.css:450-461`, `tasks-page.tsx:241-249`). Nó lấy từ thế giới của chủ thể, tương phản 11.26–13.47:1, và phân biệt được với ô trạng thái. Đây là chi tiết "sổ giấy" thành công nhất.
4. **Ô trạng thái ba hình thái** (`index.css:463-495`: trống / gạch chéo / tick). Một ký hiệu, ba giá trị, không cần màu — đúng tinh thần §13.
5. **Nhóm theo hạn với header dính** (`tasks-page.tsx:669-681`, `logic.ts:57`) và thứ tự mặc định theo hạn gần nhất. Đừng đổi sang nhóm theo board hay theo trạng thái.
6. **`tabular-nums` ở mọi ngày/giờ/số đếm** (`index.css:416-418`, dùng ở `tasks-page.tsx:139`, `:308`, `:327`). app-screens §9.1 bắt buộc.
7. **Bốn trạng thái của danh sách** (loading / empty / filtered-empty / error) ở `tasks-page.tsx:625-666` — nội dung và nút đều đúng; **chỉ sửa hình dạng skeleton** (N6), đừng đụng vào copy hay các nút reset.
8. **Phím tắt N và `/`** (`tasks-page.tsx:420-435`) kèm guard không bắt phím khi đang gõ. Đúng.
9. **Undo sau khi xoá** (`tasks-page.tsx:492-506`, `Kanban.tsx:574-596`). Giữ.
10. **Màn đăng nhập hai cột với bản xem trước động** (`sign-in-screen.tsx:203-210`) — đây là "one live thing" của trang, và nó kể đúng câu chuyện của app. Chỉ sửa cỡ cột (S9) và lề 4px (V9), đừng bỏ.

---

## 6. Phần phải kiểm bằng browser thật (lượt sau, chạy `scripts/inspect.mjs --app`)

Những điều dưới đây **không kết luận được từ mã tĩnh**:

1. **`inspect.mjs --app` ở 1440 / 768 / 390** cho cả 5 màn (`/`, `/lich`, `/boards`, `/board/:id`, sign-in). Chú ý các check: `ragged-row`, `panel-void`, `no-data-hue`, `icon-chips`, colour share, số radius, text <11px. Nhớ truyền `--allow` cho luật palette violet (xem mục 4).
2. **Tỉ lệ pixel có màu thật.** Con số ~14–15% ở mục N1 là ước lượng hình học từ `list-light.jpg`; inspector đo chính xác.
3. **Cụm "Kanban / Lịch" có nằm trên overlay của dialog không** (`Kanban.tsx:640` z-30 vs `ui/dialog.tsx` overlay z-50). Trong `card-dialog.jpg` nó hiện sáng trong khi nền đã tối — cần xác nhận đây là lỗi z-index hay chỉ là ảnh.
4. **Reflow ở 390px**: hàng task gập xuống (`tasks-page.tsx:304-311`), lưới lịch tháng 7 cột, cột kanban `w-64` (có tràn ngang không), `BoardHeaderBar` 5 nút icon + ô tìm, segmented 3 ô. Skill fail nếu sidebar còn chiếm >30% bề ngang điện thoại.
5. **Tab (641–1100px)** — dải riêng theo app-screens §12. Breakpoint `lg` của hàng task là 1024px, nên ở 768–1023 hàng dùng layout mobile trên màn rất rộng. Cần nhìn mới quyết được là nên hạ `lg:` xuống `md:`.
6. **Focus ring thật**: `--ring: oklch(0.55 0.15 292)` trên nền kem và trên bìa tím (`--sidebar-ring`), trên ô nhập đang `aria-invalid`. Tính toán tĩnh không bắt được ring bị `overflow-hidden` ở `tasks-page.tsx:609` cắt mất.
7. **Chữ Việt có dấu**: đo chiều cao dòng thật của `.font-planner` ở 28–36px (`leading-tight` = 1.25) — dấu mũ + dấu nặng ("Việc của tôi", "Đồ án SE100") có chạm dòng trên không; `line-clamp-1` ở `tasks-page.tsx:294` có cắt mất dấu huyền/nặng của dòng không; `truncate` ở `:318` và chip lịch (`month-view.tsx`) có cắt giữa chữ có dấu không.
8. **Literata có nạp subset `vietnamese` không.** `main.tsx:6-7` nạp `@fontsource/literata/500.css|600.css`. Ảnh cho thấy dấu hiển thị đúng, nhưng phải xác nhận không có fallback giữa chữ (inspector báo "families that actually rendered").
9. **Motion**: `.stamp-press` 240ms, `.task-row-flash` 1.6s, animation sign-in trễ 1.4–1.6s (`index.css:548-568`). app-screens: *"Nothing on the screen performs an entrance"* — cần xem màn đăng nhập có để nội dung trống trong 1.4s không. Và kiểm `prefers-reduced-motion`.
10. **Overflow ngang** ở board (`Kanban.tsx:678` `overflow-x-auto`) và ở lịch tuần/ngày.
11. **Trạng thái hover/selected của hàng** (`tasks-page.tsx:275` `hover:bg-accent/45`) — `--accent` ở light là `oklch(0.945 0.02 292)`, tím nhạt; ở 45% opacity trên card có thấy nổi không.
12. **Sau khi sửa N4**: ngăn kéo bỏ border, còn bậc nền `--card` (0.993) trên `--paper` (0.978) — bậc 1.5% này có nhìn thấy trên màn thật không, hay phải nới ra.

---

*Hết. Báo cáo này chỉ đọc; không file nào trong `DailyDesk_MVP/` hay `.agents/` bị sửa.*
