---
name: DailyDesk
description: Sổ kế hoạch giấy cho người Việt đi học và đi làm — giấy ấm, mực tím, lề đỏ, ô tick.
colors:
  paper: "oklch(0.978 0.01 85)"
  card: "oklch(0.993 0.005 85)"
  popover: "oklch(0.995 0.004 85)"
  rule: "oklch(0.9 0.018 80)"
  ink: "oklch(0.38 0.13 292)"
  ink-soft: "oklch(0.93 0.03 292)"
  ink-foreground: "oklch(0.99 0.005 85)"
  foreground: "oklch(0.24 0.012 285)"
  muted: "oklch(0.95 0.014 82)"
  muted-foreground: "oklch(0.47 0.02 285)"
  accent: "oklch(0.945 0.02 292)"
  accent-foreground: "oklch(0.3 0.09 292)"
  input: "oklch(0.86 0.02 80)"
  ring: "oklch(0.55 0.15 292)"
  red-ink: "oklch(0.54 0.18 25)"
  overdue: "oklch(0.54 0.18 25)"
  margin-rule: "oklch(0.72 0.12 20 / 0.55)"
  hl-high: "oklch(0.86 0.1 15 / 0.75)"
  hl-medium: "oklch(0.92 0.14 98 / 0.85)"
  sidebar: "oklch(0.962 0.012 85)"
  sidebar-foreground: "oklch(0.28 0.015 285)"
  sidebar-accent: "oklch(0.935 0.018 85)"
  sidebar-border: "oklch(0.9 0.018 80)"
  status-todo: "oklch(0.45 0.03 285)"
  status-todo-soft: "oklch(0.95 0.012 82)"
  status-doing: "oklch(0.5 0.12 75)"
  status-doing-soft: "oklch(0.93 0.11 95)"
  status-done: "oklch(0.45 0.03 285)"
  status-done-soft: "oklch(0.95 0.012 82)"
  prio-high: "oklch(0.56 0.17 15)"
  prio-medium: "oklch(0.68 0.14 90)"
  prio-low: "oklch(0.62 0.02 285)"
colorsDark:
  paper: "oklch(0.17 0 0)"
  card: "oklch(0.21 0 0)"
  popover: "oklch(0.23 0 0)"
  rule: "oklch(0.27 0 0)"
  muted: "oklch(0.25 0 0)"
  muted-foreground: "oklch(0.74 0.015 285)"
  secondary: "oklch(0.26 0 0)"
  input: "oklch(0.33 0 0)"
  sidebar: "oklch(0.15 0 0)"
  foreground: "oklch(0.93 0.01 85)"
  ink: "oklch(0.8 0.1 292)"
  red-ink: "oklch(0.72 0.15 25)"
  status-done: "oklch(0.72 0.015 285)"
typography:
  planner-heading:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  group-heading:
    fontFamily: "Literata, ui-serif, Georgia, serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body-strong:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "\"tnum\""
  stamp:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  full: "9999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
layout:
  canvas: "mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 lg:px-10"
  planner-margin: "3rem"
  planner-margin-sm: "3.25rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "36px"
  planner-tab:
    textColor: "{colors.muted-foreground}"
    padding: "0 4px"
    height: "36px"
  planner-tab-active:
    textColor: "{colors.foreground}"
    padding: "0 4px"
    height: "36px"
  status-box:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.md}"
    width: "20px"
    height: "20px"
  highlighter:
    backgroundColor: "{colors.hl-medium}"
    rounded: "0.2em 0.5em 0.3em 0.45em"
    padding: "0.05em 0.35em"
  stamp:
    textColor: "{colors.red-ink}"
    rounded: "{rounded.full}"
    padding: "0 7px"
    height: "22px"
  filter-pill:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  segmented:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    padding: "4px"
  segmented-option-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "28px"
  task-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    padding: "10px 20px"
  drawer:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
  board-column:
    backgroundColor: "color-mix(in oklch, {colors.card} 60%, {colors.paper})"
    rounded: "{rounded.lg}"
  board-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px"
  nav-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "36px"
---

# Design System: DailyDesk

> **KHÔNG CÒN ĐÚNG VỚI CODE (07/11/2026).**
> Giao diện đã được đưa về bản gốc của repo `DailyDesk/` theo yêu cầu:
> theme shadcn trung tính, nền board là ảnh/màu phủ kín, thanh công cụ kính mờ,
> card board kiểu bìa hồ sơ. Mọi thứ viết ở dưới về "sổ kế hoạch giấy",
> mực tím, bút dạ quang hay con dấu XONG không còn trong code nữa.
> Giữ lại làm hồ sơ quá trình.

> Tài liệu này mô tả **giao diện đang chạy**, không mô tả ý định. Mọi giá trị dưới đây
> đọc ra từ `src/index.css` và từ ảnh chụp bản chạy thật. Nếu mã đổi, sửa file này;
> đừng sửa mã cho khớp một mô tả đã cũ.

## North Star

DailyDesk là **một cuốn sổ kế hoạch giấy**. Trang giấy ấm hơi ngả kem, chữ than chì,
một đường lề đỏ mảnh chạy dọc bên trái, mực tím của bút học trò dùng để viết dữ liệu,
bút dạ quang đánh dấu việc gấp, và một con dấu đỏ đóng xuống đúng lúc tick xong một việc.

Cuốn sổ này là thứ người ta mở ra mỗi sáng và gạch đi từng dòng. Nên thước đo không phải
"trông có ấn tượng không", mà là: **quét mắt một lượt có biết hôm nay phải làm gì chưa,
và gạch một việc mất mấy thao tác.**

## Ngân sách màu

Luật quan trọng nhất của hệ thống này, và cũng là luật dễ phá nhất:

> **Màu đi trên dữ liệu, không đi trên khung.** Tối đa ~5% số điểm ảnh của màn hình có màu.

Khung — sidebar, thanh tiêu đề, nền thẻ, viền — đều là **giấy**. Mực tím chỉ được xuất hiện ở:

1. Vạch gáy sổ 4px ở mép phải sidebar (`shadow-[inset_-4px_0_0_var(--ink)]`).
2. Vạch mực 3px bên trái mục điều hướng đang mở.
3. Đúng **một** nút chính mỗi màn ("Thêm task").
4. Con trỏ nhập (`caret-color`), vòng focus, và vùng chọn văn bản.

Đỏ (`red-ink`) chỉ dành cho **việc quá hạn** và **con dấu XONG**. Hổ phách (`status-doing`)
chỉ dành cho **đang làm**. Không có hue thứ tư.

### Mực tím là màu của chủ thể

Nhiều bộ quy tắc thiết kế cấm thẳng tím/violet vì nó là màu mặc định của hàng loạt sản phẩm SaaS.
Ở đây **giữ hue 292 là có chủ ý**: nó là màu mực bút bi tím trong vở học trò Việt Nam, tức là
màu lấy từ chính thế giới của người dùng, không phải màu mượn từ một trang web khác.

Điều kiện để giữ nó: **không được dùng làm chrome**. Khi chạy
`.agents/skills/design-taste-frontend/scripts/inspect.mjs --app`, phải truyền `--allow` cho luật
palette violet, và phải kiểm lại tỉ lệ điểm ảnh có màu nằm dưới 5%.

## Colors

### Mực (ink)
`ink` tím 292 là màu viết. Dùng cho: nút chính, vạch gáy, mục nav đang mở, caret, focus ring.
**Không** dùng làm nền mảng lớn, **không** dùng cho trạng thái Xong.

### Giấy (paper, card, popover)
Ba bậc giấy rất gần nhau: trang (`paper` 0.978) → tờ (`card` 0.993) → tờ nổi (`popover` 0.995).
Bậc cách nhau khoảng 1.5%, vừa đủ tách mà không thành "khối". Cột kanban nằm giữa trang và tờ:
`color-mix(in oklch, var(--card) 60%, var(--paper))`.

### Trạng thái
| Trạng thái | Màu | Ghi chú |
|---|---|---|
| Cần làm | `status-todo` than chì | Không nền |
| Đang làm | `status-doing` hổ phách | Có nền `status-doing-soft` |
| Xong | `status-done` than chì nhạt | **Không nền màu.** Xong là trạng thái yên nhất |
| Quá hạn | `overdue` = `red-ink` | Chỉ ở ngày hạn, không tô cả dòng |

Trước đây `status-done` trỏ thẳng vào `ink`, tức là trạng thái cần yên nhất lại được tô bằng
màu nổi nhất của hệ thống. Đã sửa; **đừng trỏ ngược lại**.

### Ưu tiên
Ưu tiên **không** dùng ô vuông hay chấm tròn, mà dùng **vệt bút dạ quang** (`.hl`): `hl-high`
hồng cho Cao, `hl-medium` vàng cho Vừa, Thấp không tô. Tương phản chữ trên dạ quang đạt
11.26–13.47:1. Đây là chi tiết "sổ giấy" thành công nhất của hệ thống — đừng thay bằng badge.

### Chế độ tối
Nền tối **trung tính tuyệt đối**: mọi token nền có chroma **đúng bằng 0**
(`paper` `oklch(0.17 0 0)`, `card` `0.21`, `popover` `0.23`, `muted` `0.25`, `sidebar` `0.15`).
Không navy, không slate, không nhuộm tím nền. Tím chỉ còn trong `ink`.

## Typography

Hai mặt chữ, mỗi mặt **một việc duy nhất**:

- **Be Vietnam Pro** — toàn bộ giao diện: tiêu đề task, nhãn, meta, nút, ô nhập.
- **Literata** (`.font-planner`) — **chỉ** H1 của màn và tiêu đề nhóm ngày trong danh sách.

Không thêm mặt chữ thứ ba. Không dùng Literata cho logo, tên board, tiêu đề empty state hay
H2 — đã từng bị dùng lung tung ở sáu chỗ, đã gom lại còn hai.

### Hierarchy
- **H1 màn app: 28px** (`text-[1.75rem]`), Literata 600, `leading-tight`. Đây là trần.
  Chữ app không phải chữ trưng bày; vượt 32px là sai. Màn đăng nhập là *trang*, không phải
  màn app, nên được dùng 36/41.6px.
- Tiêu đề task 15px / 500. Meta và ngày 13px. **Không có chữ nào dưới 11px.**
- Mọi ngày, giờ, số đếm dùng `tabular-nums` (`.tabular`) để so sánh được theo cột dọc.

## Layout

Cả bốn màn app dùng **chung một lề canvas**:

```
mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-6 lg:px-10
```

Một mép trái duy nhất chạy từ tiêu đề xuống hàng cuối. Khi đổi tab, khung không được nhảy.

### Đường lề đỏ
`--planner-margin` (3rem, 3.25rem từ breakpoint `sm`) là **một mốc duy nhất** cho cả đường lề
đỏ (`.planner-page::before`) lẫn mép trái của cột tiêu đề. Đừng đặt lại hai con số rời nhau:
trước đây chúng lệch 4px ở `sm` và đường lề cắt vào trong ô tiêu đề.

### Title row
Mọi màn mở đầu bằng cùng một khối: dòng ngày nhỏ → H1 → **một câu dữ liệu** → nút chính bên phải.

Câu dữ liệu nói về **dữ liệu**, không dạy cách dùng giao diện:
`"18 việc chưa xong · 3 việc quá hạn"` (số quá hạn là nút đổi bộ lọc), `"3/14 task đã xong · 2 quá hạn"`.
Không viết "Bấm vào task để sửa…". Nếu một control cần một câu hướng dẫn cách bấm thì phải
thiết kế lại control, không thêm câu.

### Mật độ
Hàng task `py-2.5`, ô tick 20px, `gap-x-3`. Lưới cột cố định để mắt quét dọc theo cột, không
phải chip rời trôi nổi. Cột ngày căn **phải** — ngày là thứ người ta so sánh theo chiều dọc.

## Elevation & Depth

> **Một mặt phẳng, một bóng.**

Toàn app có **đúng một** resting shadow: "ngăn kéo" bọc danh sách task ở `tasks-page.tsx`.
Mọi thứ khác phân tầng bằng **bậc nền và viền 1px**, không bằng bóng.

Luật cứng: **viền hoặc bóng, không bao giờ cả hai** trên cùng một bề mặt đứng yên.
Ngăn kéo có bóng thì không có viền. Thẻ board có viền thì không có `shadow-sm`.
Nút outline không có `shadow-xs`.

## Shapes

`--radius: 0.375rem` (6px). Bo góc theo dải hẹp: **6px** cho mọi khối, **4px** cho chip nhỏ và
ô trạng thái, **999px** chỉ cho con dấu và avatar. Không có 12px, không có 16px.

## Components

### Ô trạng thái (`.status-box`) — chữ ký của hệ thống
Một ký hiệu 20px, ba hình thái, **không cần màu**:
- trống = Cần làm
- một nét gạch chéo = Đang làm
- đã tô + tick = Xong

### Con dấu XONG (`.stamp`)
11px, `letter-spacing: 0.06em`, viền 1.5px `red-ink`, xoay -6°, tương phản 5.44:1.

**Chỉ đóng một lần, đúng khoảnh khắc vừa tick, rồi biến mất.** Không được thường trú trên mọi
dòng Done: dòng Done đã có ô tick đã tô, tiêu đề gạch ngang và chữ mờ đi — con dấu là mark thứ tư
nói cùng một điều, và khi lặp lại thì đỏ thành hoạ tiết chứ không còn là tín hiệu.

### Sidebar = gáy sổ
Nền giấy (`sidebar`, đậm hơn trang một bậc), vạch mực 4px ở mép phải. Mục đang mở: nền
`sidebar-accent` + vạch mực 3px bên trái. **Không** tô kín sidebar bằng màu mực.

### Nút
Một primary mỗi màn, và nó là hành động của màn đó ("Thêm task"). Mọi nút khác là `outline`
hoặc `ghost`. **Không có nút nổi `fixed`** — chuyển chế độ xem là segmented control nằm trong
title row, không phải nút trôi giữa màn.

### Mô hình lưu
> **Một mô hình lưu cho mỗi view.**

Các **trường** (tiêu đề, mô tả, hạn chót, ưu tiên, trạng thái) gom vào bản nháp cục bộ và chỉ
gửi đi khi bấm **Lưu thay đổi** — đúng yêu cầu của `spec.md` (báo lỗi khi bấm lưu, toast
"Đã lưu thay đổi"). Cả hộp thoại ở danh sách lẫn hộp thoại ở board đều theo mô hình này, và
**cùng thứ tự trường**: Tiêu đề → Mô tả → Hạn chót → Độ ưu tiên → Trạng thái.

Các **thao tác trên đối tượng riêng** — bình luận, việc con, nhãn, ảnh bìa, thành viên — vẫn
lưu ngay khi thực hiện. Thêm một bình luận là một hành động, không phải sửa một trường.

### Trạng thái tải
Skeleton phải có **hình dạng của trạng thái đã tải**: đúng số cột, đúng chiều cao chữ của từng
cột, đúng pitch của hàng, nhãn và header hiện ngay. **Không dùng `animate-pulse`**, dùng
`bg-muted` tĩnh. Khi dữ liệu về, layout không được nhảy.

### Nhãn hiển thị vs tên dữ liệu
`STATUS_TEXT` (`Cần làm / Đang làm / Xong`) là chữ cho người đọc.
`STATUS_LABEL` (`Todo / Doing / Done`) là **tên danh sách gửi lên backend** — là dữ liệu.
Đừng gộp hai thứ này: đổi nhãn hiển thị không được làm đổi tên list trong cơ sở dữ liệu.

## Do's

- Viết **mọi** chữ hiện ra màn hình, toast và chữ cho trình đọc màn hình bằng **tiếng Việt**.
- Cho mỗi nút chỉ có icon một `aria-label` tiếng Việt.
- Giữ chiều cao control trong title row và hàng bộ lọc ở 32–40px.
- Dùng icon nội dòng cỡ 12–14px.
- Đặt một mép phải chung cho mỗi hàng; số và ngày căn phải.
- Chọn số cột theo số phần tử, đừng để lưới 4 cột với 1 board.
- Giữ `prefers-reduced-motion` cho mọi animation.

## Don'ts

- **Đừng** tô kín sidebar hay thanh tiêu đề bằng màu mực.
- **Đừng** cho `status-done` trỏ vào `ink`.
- **Đừng** nhuộm màu vào nền chế độ tối.
- **Đừng** dùng cả viền lẫn bóng trên một bề mặt đứng yên.
- **Đừng** thêm nút nổi `fixed` cho thứ không phải hành động chính của màn.
- **Đừng** dùng bảng màu Tailwind thô (`bg-green-100`, `text-amber-950`…) — mọi màu phải là token.
- **Đừng** đặt chữ dưới 11px, hay nhãn chữ hoa giãn chữ quá 0.06em.
- **Đừng** dùng `backdrop-blur` (kính mờ) hay viền nét đứt ngoài lưới biểu đồ và ô trống.
- **Đừng** để `cursor-grab` làm con trỏ mặc định trên bề mặt làm việc.
- **Đừng** giấu hành động chính sau hover (`opacity-60 group-hover:opacity-100`).
- **Đừng** đặt thanh tiến độ không có nhãn số lên thẻ hay hàng task.
- **Đừng** thêm mặt chữ thứ ba.

## Known Drift

Những chỗ mã **đang** lệch khỏi tài liệu này, biết và chấp nhận tạm:

1. **Hướng "sổ giấy" mới đi được một nửa.** Hiện chỉ có đường lề đỏ và con dấu là thiết bị giấy
   thật. Chưa có kẻ dòng, chưa có bậc giấy ở mép trang. Sau khi con dấu thôi thường trú, trạng
   thái nghỉ của danh sách gần như không còn dấu hiệu "giấy" nào — cần bù bằng kẻ dòng mảnh
   hoặc mép giấy ở lượt sau.
2. **`AVATAR_COLORS`** trong `BoardHeaderBar.tsx` vẫn là bảng màu Tailwind thô, ngoài hệ token.
   Hiện bị ẩn sau cờ `SHOW_COLLABORATION = false` nên chưa hiện ra.
3. **4 lỗi kiểu có sẵn** trong `card-create-dialog.tsx` và `card-edit-dialog.tsx` chưa sửa;
   chúng nằm ngoài `tsconfig.mvp.json` và `vite build` không typecheck nên không chặn CI.
4. **`typecheck:mvp` không bao `src/components/**`.** Cổng kiểm thật cho component là `pnpm build`.
5. **Chưa chạy `inspect.mjs --app`** để đo tỉ lệ điểm ảnh có màu, focus ring và motion trên màn
   thật. Mục 6 của `docs/UI_AUDIT_TASTE.md` liệt kê 12 thứ cần đo.
