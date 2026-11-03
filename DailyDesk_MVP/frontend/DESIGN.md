---
name: DailyDesk
description: Personal task desk for Vietnamese students and office workers, drawn as an office file folder.
colors:
  paper: "oklch(0.982 0.004 240)"
  sheet: "oklch(1 0 0)"
  ink: "oklch(0.25 0.03 258)"
  ink-soft: "oklch(0.49 0.025 258)"
  navy: "oklch(0.38 0.1 258)"
  navy-foreground: "oklch(0.99 0 0)"
  drawer-tint: "oklch(0.955 0.008 245)"
  hover-wash: "oklch(0.945 0.016 245)"
  hairline: "oklch(0.9 0.012 245)"
  field-edge: "oklch(0.87 0.014 245)"
  focus-blue: "oklch(0.58 0.13 255)"
  sidebar-paper: "oklch(0.965 0.007 245)"
  sidebar-active: "oklch(0.925 0.02 245)"
  tab-todo: "oklch(0.5 0.12 250)"
  tab-todo-soft: "oklch(0.94 0.035 245)"
  tab-doing: "oklch(0.52 0.12 62)"
  tab-doing-soft: "oklch(0.94 0.07 85)"
  tab-done: "oklch(0.48 0.1 155)"
  tab-done-soft: "oklch(0.94 0.045 155)"
  prio-high: "oklch(0.55 0.19 28)"
  prio-medium: "oklch(0.62 0.14 70)"
  prio-low: "oklch(0.6 0.03 250)"
  overdue: "oklch(0.53 0.19 27)"
  destructive: "oklch(0.56 0.2 27)"
  manila-panel: "oklch(0.94 0.065 90)"
  manila-sheet: "oklch(0.995 0.004 90)"
  manila-ink: "oklch(0.27 0.035 60)"
typography:
  headline:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "\"cv11\", \"ss01\""
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
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.navy-foreground}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  folder-tab:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  folder-tab-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "40px"
  status-pill-todo:
    backgroundColor: "{colors.tab-todo-soft}"
    textColor: "{colors.tab-todo}"
    rounded: "{rounded.full}"
    height: "28px"
    width: "5.5rem"
  status-pill-doing:
    backgroundColor: "{colors.tab-doing-soft}"
    textColor: "{colors.tab-doing}"
    rounded: "{rounded.full}"
    height: "28px"
    width: "5.5rem"
  status-pill-done:
    backgroundColor: "{colors.tab-done-soft}"
    textColor: "{colors.tab-done}"
    rounded: "{rounded.full}"
    height: "28px"
    width: "5.5rem"
  filter-pill:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  segmented:
    backgroundColor: "{colors.drawer-tint}"
    rounded: "{rounded.lg}"
    padding: "4px"
  segmented-option-active:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "32px"
  task-row:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    padding: "12px 20px"
  drawer:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.xl}"
  board-card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "14px 16px"
  nav-item-active:
    backgroundColor: "{colors.sidebar-active}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
---

# Design System: DailyDesk

## Overview

**Creative North Star: "The Office File Folder"**

DailyDesk is a filing cabinet drawer on cool office paper. Status is a set of folder index tabs physically joined to the drawer below them; each task is one ruled line on a form inside that drawer. Text and the one primary action are written in navy ink. Everything else is paper, hairlines, and three tab hues that mean exactly one thing each: Todo, Doing, Done.

Density is a working list, not a dashboard. Rows are short (12px vertical padding), metadata sits in fixed columns on desktop and folds under the title on narrow screens, and deadline is the default order of everything. The system rejects card grids for tasks, hero metrics, gradients, and glass: depth comes from one soft drawer shadow and tonal paper steps.

The one moment of motion that matters is acknowledgement: a row that just changed stays washed in manila for a beat so the person notices it. The sign-in screen carries the same folder world in a warmer manila register.

The people at this desk are Vietnamese students and office workers between classes or meetings. The system is judged by how little they have to think: every action is a visible click or a key, nothing depends on dragging, hovering, or right-clicking, and every element on screen earns its place. A screen should never feel like an empty form, and never like a spreadsheet of every field the data model holds. The rule of thumb is the paper form itself: one line per task, the facts needed to decide what to do next, and everything else one click away inside the folder.

**Key Characteristics:**
- Cool blue-grey paper ground, white sheets, navy ink; color reserved for status and priority.
- Folder index tabs with a 3px colored lip, joined to a bordered drawer.
- Ruled task rows divided by hairlines, grouped under sticky deadline headers.
- Be Vietnam Pro throughout; tabular figures for every date, time, and count.
- Gentle 8px corners, hairline borders, one soft drawer shadow.
- Click-first operation: status, deadline, and placement change through a visible control; drag is only an accelerator.
- Fixed information budget per row and per card; secondary detail lives in the dialog, not on the line.

## Colors

A restrained cool-paper palette with navy ink, plus a fixed semantic set of three tab hues and three priority marks.

### Primary
- **Folder Navy** (navy): the single primary action per view ("Thêm task", dialog submit), the active sidebar text, and the default board tab color. Never used as a decorative fill.

### Secondary (semantic status hues)
- **Todo Blue** (tab-todo / tab-todo-soft): text and pale wash of the Todo pill, Todo tab lip, Todo dots.
- **Manila Amber** (tab-doing / tab-doing-soft): Doing pill and tab lip; its soft tone is also the row-flash wash and the text-selection color.
- **Ledger Green** (tab-done / tab-done-soft): Done pill, tab lip, and dots.

### Tertiary (priority and alarm)
- **Stamp Red** (prio-high): the High priority square.
- **Ochre** (prio-medium): the Medium priority square.
- **Slate** (prio-low): the Low priority square, drawn at 70% opacity.
- **Overdue Red** (overdue): overdue deadlines, the "Quá hạn" group header, and the "N việc quá hạn" link in the page header.
- **Destructive Red** (destructive): delete actions, validation errors, error panels at 10% wash.

### Neutral
- **Office Paper** (paper): app background.
- **White Sheet** (sheet): drawer, cards, inputs, popovers, the active folder tab.
- **Navy Ink** (ink): all body text and titles.
- **Faded Ink** (ink-soft): secondary text, column headers, inactive tabs, placeholders at 80%.
- **Drawer Tint** (drawer-tint): drawer toolbar band (at 40%), segmented track, count badge on the active tab, skeletons.
- **Hover Wash** (hover-wash): hover on rows (at 50%), pills, and icon buttons.
- **Hairline** (hairline) and **Field Edge** (field-edge): dividers and borders; inputs and pills use the slightly darker field edge.
- **Focus Blue** (focus-blue): every focus ring and focused input border.
- **Sidebar Paper** (sidebar-paper) / **Sidebar Active** (sidebar-active): the sidebar ground and its active item.
- **Manila Panel / Sheet / Ink** (manila-panel, manila-sheet, manila-ink): scoped to the sign-in screen only, the warm folder-cover side of the same world.

Dark theme re-inks every role on a deep navy ground (background oklch(0.2 0.018 258), card oklch(0.24 0.02 258)); status hues flip to light text on dark soft tints. The sidecar records the dark values.

### Named Rules
**The Three Tabs Rule.** Blue, amber, and green mean Todo, Doing, Done, and nothing else. A new feature may not borrow a status hue for decoration.

**The One Navy Rule.** Each view has one filled navy button. Secondary actions are outline or ghost.

**The Square Means Priority Rule.** Priority is a 10px rounded square (3px radius); status is a round dot or pill. The shapes never swap.

## Typography

**Display Font:** none; the system has no display face.
**Body Font:** Be Vietnam Pro (with ui-sans-serif, system-ui, sans-serif), self-hosted at 400/500/600/700, with `cv11` and `ss01` enabled on `html`.

**Character:** One Vietnamese-native sans carries everything; hierarchy comes from size and weight steps, not from a second family. Diacritics stay clean at every size.

### Hierarchy
- **Headline** (600, 24px mobile / 28px desktop, tight tracking): page H1 such as "Việc của tôi". Sign-in uses the same weight at 30–36px.
- **Title** (600, 18px): dialog titles ("Thêm task mới", "Sửa task").
- **Body strong** (500, 15px): task titles in rows, board card titles (600), input text.
- **Body** (400, 14px): descriptions, filter pills, field labels (500), subtitle line.
- **Meta** (400, 13px, tabular): row meta on narrow screens, board card counts.
- **Label** (600, 12px): deadline group headers ("Quá hạn", "7 ngày tới"); column headers use 500.

### Named Rules
**The Tabular Clock Rule.** Every date, time, and count is set with tabular figures and the shared Vietnamese formats: "Hôm nay", "Ngày mai", "T4, 4/11", "T4, 4/11, 17:00", "Tháng 11, 2026". Do not hand-format dates in a component.

**The No Small Caps Rule.** Labels are sentence case at 12px; the system has no uppercase tracked micro-labels.

## Layout

The signed-in app is a left sidebar (Việc của tôi / Lịch / Board) beside a centered content column capped at 72rem (max-w-6xl), padded 16 / 24 / 32px at mobile / sm / lg, 24px top and 64px bottom. The page header is a wrap row: H1 plus a one-line status sentence on the left, the navy primary action on the right.

Below the header (24px gap), folder tabs sit directly on the drawer (`-1px` overlap so the active tab merges into the drawer border). On mobile the four tabs become an equal 4-column grid; from `sm` they size to content.

Inside the drawer: a toolbar band (12px × 16–20px padding) with a flexible search field (basis 14rem) and wrapping pills; then, at `lg` only, a column header grid `5.5rem / 1fr / 9rem / 6rem / 10.5rem / 2rem` that the rows share. Below `lg`, rows collapse to `status / title / actions` and meta folds under the title.

Spacing runs on a 4px base: 4, 8, 12, 16, 20, 24px, with 2px reserved for tab gaps. Dialogs use 24px horizontal and 20px vertical padding with 20px between fields.

**The Deadline First Rule.** Lists default to nearest deadline and group under sticky deadline headers; other sorts flatten the groups.

### Density budget

Density is balanced, not maximal. These budgets are taken from the shipped "Việc của tôi" list, the reference surface; other surfaces conform to them.

- **Page header:** H1, one status sentence of at most three facts (open count, overdue count as a link, today's date), and the one navy action. No stat tiles, no greeting, no second action row.
- **Toolbar:** one search field plus at most three select pills (today: "Ưu tiên", "Board", "Sắp xếp") and a "Xoá bộ lọc" ghost button that appears only while a filter is active. A pill that would offer a single real choice is hidden (the Board pill already hides when there is one board).
- **Task row:** status pill, title (one line at `lg`, two below), at most one line of description, then at most three metadata fields: board, priority, deadline. Overdue adds one "Trễ …" line under the deadline. One overflow "…" button. Nothing else belongs on a row: no labels, members, checklist progress, comment or attachment counts, cover images, or created dates.
- **Board card (Kanban):** title (two lines max), one date line, one priority mark, optional cover. At most two metadata items under the title.
- **Board tile (Board list):** board name plus the three Todo / Doing / Done counts, or "Chưa có task" when empty.
- **Counts:** each number appears once per view. Folder tabs own the per-status counts; the header sentence owns open and overdue; group headers own their group size. Do not repeat a count in a footer, badge, or tooltip.
- **Hints:** a keyboard hint appears once, next to the control it triggers (the "N" `kbd` on "Thêm task", the "/" `kbd` in search).

**The Earned Element Rule.** Every element answers "what do I do next?" or "is this mine and when is it due?". If removing it would not slow the person down, it does not ship on the line; move it into the dialog.

**The Not Empty, Not Crowded Rule.** The first viewport always holds the header, the filters, and real rows or a designed empty state; it never shows a lone form or a blank canvas. A row never exceeds the budget above, and a field that is unset shows a quiet placeholder ("—", "Không có hạn") rather than being dropped from a desktop column, so columns stay aligned.

**The One Board Rule.** When the person has only one board, every board selector, filter, and board column is redundant and hides; the board name is still available inside the dialog.

## Elevation & Depth

Mostly flat with tonal layering: paper ground, white sheet, tinted toolbar band. Shadows are soft, cool, and few; the drawer owns the only resting shadow on a page.

### Shadow Vocabulary
- **Drawer** (`box-shadow: 0 1px 2px rgb(0 0 0/0.04), 0 8px 24px -12px rgb(15 23 42/0.12)`): the task drawer under the folder tabs.
- **Card lift** (`box-shadow: 0 6px 18px -10px rgb(15 23 42/0.25)`): board cards on hover only, with the border shifting to focus blue at 60%.
- **Raised option** (`box-shadow: 0 1px 2px rgb(0 0 0/0.08)`): the selected option in a segmented control.
- **Field inset** (`box-shadow: inset 0 1px 0 rgb(0 0 0/0.02)`): text inputs.
- **Sign-in sheet** (`box-shadow: 0 18px 40px -18px oklch(0.55 0.11 70 / 0.45)`): the preview sheet on the manila panel.

### Named Rules
**The One Drawer Rule.** One resting shadow per view, on the drawer. Everything else is flat until hovered or selected.

## Shapes

Gently curved, paper-like corners from a 0.5rem base: 4px for tiny controls, 6px for buttons, inputs, and pills, 8px for folder tabs (top corners only) and segmented tracks, 12px for the drawer and board cards. Status pills and count badges are fully round. Borders are 1px hairlines everywhere.

The recurring silhouette is the folder tab: a top-rounded tab joined to a container. The status tabs use it at full size; each board card carries a small 64 × 10px tab in the board's color above its top-left edge. The drawer's top-left corner is square where the first tab joins it (rounded-b-xl rounded-tr-xl).

## Components

### Buttons
Quiet and competent; only one is loud.
- **Shape:** gently rounded (6px).
- **Primary:** navy fill, white text, 40px tall, 16px horizontal, leading plus icon; the header action carries a `kbd` "N" hint at 30% white border.
- **Hover / Focus:** shadcn defaults (90% fill on hover), 2px focus-blue ring.
- **Outline / Ghost:** white sheet with field-edge border for "Thử lại", "Xoá bộ lọc"; ghost for in-toolbar resets. Destructive in dialogs is a ghost with red text and a 10% red hover wash; the confirm "Xoá task" is solid destructive.

### Chips
- **Status pill:** 28px tall, fixed 5.5rem wide, fully round, soft status tint with status-colored 12px semibold text and a chevron; it is a menu trigger ("Chuyển sang"). Hover darkens 5% (brightens 10% in dark).
- **Filter pill:** 36px, white sheet, field-edge border, 6px radius, "Ưu tiên: Tất cả" pattern with the label in faded ink and the value in medium weight.
- **Priority tag:** 10px square in priority color plus label ("Cao", "Vừa", "Thấp"); an em dash when unset.

### Cards / Containers
- **Drawer:** white sheet, hairline border, 12px radius except the tab-joined corner, drawer shadow, overflow hidden.
- **Board card:** white sheet, hairline border, 12px radius, 14px × 16px padding, folder tab above, Todo/Doing/Done dot counts in meta type; hover lifts with the card-lift shadow.

### Inputs / Fields
- **Style:** 40px (search 36px), white sheet, field-edge border, 6px radius, 15px text, faint inset top shadow, search icon at 12px left.
- **Focus:** border turns focus blue plus a 3px focus-blue ring at 25%.
- **Error:** destructive border and 20% destructive ring; message in 14px destructive below the field. Field labels are 14px medium with an optional right-aligned tabular hint.
- **Segmented control:** drawer-tint track with 4px padding; options 32px, selected option lifts onto white with the raised-option shadow; each option leads with its status or priority dot.

### Navigation
- **Sidebar:** sidebar-paper ground, 36px logo plus "DailyDesk" at 15px semibold, items 36px medium weight; active item on sidebar-active with darker ink.
- **Folder tabs:** 40px, inactive tabs transparent in faded ink; hover washes the tab with 60% sheet and shows the status lip at 50%; the active tab becomes a white sheet with border, sits above the drawer edge, shows its 3px status lip at full strength, and fills its count badge.

### Task Row (signature)
A ruled form line: status pill, title (15px medium, underline on hover, one line on desktop), one-line description in faded ink, then board, priority, and deadline columns. Overdue deadlines turn overdue red and medium weight with a "Trễ …" line underneath; done tasks strike through in faded ink. The row action button appears on hover/focus at `lg`. After any create, edit, or status change the row takes the manila flash (Doing soft at 70%) for 2.4s and fades over 1.6s on `cubic-bezier(0.16, 1, 0.3, 1)`.

### Task Dialog
The add/edit form ("Thêm task mới" / "Sửa task") is the single place where a task is filled in. Fields run in decision order: "Tiêu đề" (the only required field, stated in the description line "Chỉ tiêu đề là bắt buộc. Các ô khác có thể điền sau."), "Mô tả", "Hạn chót" (date button + time select, "Bỏ hạn" to clear), "Độ ưu tiên" and "Trạng thái" as segmented controls, then "Lưu vào board" only when there is more than one board. Footer: ghost destructive "Xoá task" at left; "Huỷ" outline and one navy submit at right. Errors appear under the field and focus moves to the first invalid one. The larger board card dialog follows the same order: status and priority first, then deadline and description, then labels, checklist, attachments, and cover.

### Interaction model
The person must be able to do everything with clicks and the keyboard alone.

- **Change status:** one click on the status pill opens "Chuyển sang" with the three statuses; the dialog offers the same choice as a segmented control. Any surface that shows a task must offer one of these two.
- **Change deadline:** through the "Hạn chót" field in the dialog (calendar popover plus time select). A calendar may also accept dragging an item to another day, but clicking the item must open that field.
- **Move or reorder on a board:** a card's menu offers "Chuyển sang" with every list of the board; list order and card order have menu commands too. Drag is an accelerator on top, never the only path.
- **Open:** clicking anywhere on a row or card opens it; Enter on the focused title does the same.
- **Delete:** from the row or card menu or the dialog footer, then a confirm dialog ("Xoá task này?", "Giữ lại" / "Xoá task"), then a toast with "Hoàn tác".
- **Feedback:** every mutation gets a toast in Vietnamese and, on lists, the manila row flash.
- **Shortcuts:** N adds a task, / focuses search; both are disabled while typing or inside a dialog.
- **Targets:** icon buttons are at least 32px (size-8) with an `aria-label`; primary actions are 40px.

**The No Drag Required Rule.** Every change that dragging can make (status, list, order, date) has a visible click or keyboard path on the item or in its menu. Copy never tells the person to drag as the way to do something, and the default cursor on a working surface is never a grab hand.

**The Visible Action Rule.** No action lives only behind hover or right-click. Hover may reveal a shortcut button (the row "…" at `lg`) only when the same action is reachable by opening the item; context menus may duplicate a visible menu but never replace it.

**The One Status Rule.** A task has exactly one status, Todo / Doing / Done. A separate "done" checkbox that can disagree with the card's list is not allowed; ticking done means moving to Done.

### Empty, loading and error states
Each list region has four designed states, all inside the drawer so the page frame never collapses:

- **Loading:** five skeleton rows shaped like real rows (pill, title bar, meta bar); never a bare "Đang tải…" line.
- **Empty (no data yet):** 32px muted icon, a one-line headline ("Chưa có task nào"), one sentence that says what to do and why, and exactly one navy action ("Thêm task đầu tiên"). This repeats the header action where the eye already is, and is the only sanctioned exception to The One Navy Rule.
- **Filtered empty:** search-off icon, a headline naming the cause ("Không có task nào khớp bộ lọc" or "Không có task nào ở trạng thái Doing"), the query quoted when there is one, and only outline reset actions ("Xoá bộ lọc", "Xem tất cả").
- **Error:** destructive icon, "Không tải được …", the reason in faded ink, and an outline "Thử lại".

Empty states are text and one icon, centered, 64px vertical padding. No illustrations, no marketing copy, no tips carousel.

## Do's and Don'ts

### Do:
- **Do** join status tabs to the drawer with the -1px overlap and a 3px status lip on the active tab.
- **Do** use the shared date helpers and tabular figures for every date, time, and count.
- **Do** keep one filled navy button per view and make everything else outline or ghost.
- **Do** mark priority with the 10px square and status with dots or pills, colored only from the status and priority tokens.
- **Do** flash a changed row in the manila wash so the change is noticed, and respect reduced motion for any added animation.
- **Do** design every list state: skeleton rows, empty with a first action, filtered-empty with a reset, error with "Thử lại".
- **Do** give every drag interaction a click path: a "Chuyển sang" menu for lists and status, menu commands for order, the "Hạn chót" field for dates.
- **Do** keep a task row to status, title, one description line, and at most three metadata fields (board, priority, deadline).
- **Do** hide a filter, column, or selector the moment it can only offer one real choice.
- **Do** give every icon-only button an `aria-label` in Vietnamese and a 32px minimum target.
- **Do** write all visible, toast, and screen-reader copy in Vietnamese with one spelling: "Xoá", "Huỷ", "task" (not "thẻ" or "card").

### Don't:
- **Don't** lay tasks out as a grid of cards, or add hero metrics, gradients, or glass panels.
- **Don't** use a status hue (blue, amber, green) for anything that is not that status.
- **Don't** add a second resting shadow beside the drawer, or heavier shadows than the drawer's.
- **Don't** introduce a second typeface or uppercase tracked labels.
- **Don't** pull the manila sign-in palette into the signed-in app; it is scoped to sign-in.
- **Don't** make any action drag-only, hover-only, or right-click-only, and don't write copy such as "Kéo … để …" that presents dragging as the way to do something.
- **Don't** put labels, members, checklist progress, comment or attachment counts, or progress bars on task rows or board cards.
- **Don't** repeat the same count or the same shortcut hint twice in one view.
- **Don't** let a task carry a "done" checkbox that can disagree with its Todo / Doing / Done status.
- **Don't** ship a bare "Đang tải…" line, an error with no "Thử lại", or an empty state with no next action.

## Known Drift

<!-- DRIFT LOG: violations of the rules above, not rules. Remove an item when the code is fixed. -->

The 13 items recorded by /impeccable document on 2026-11-03 were fixed the same day (calendar click paths and saving, board click-to-move and reorder menus, visible card and column menus, Done checkbox moving the card, undo on delete, glass and off-palette chrome removed, Vietnamese copy, card dialog order and labels, board list primary action and empty states, single-board column hiding, shared date formatting, footer hint trimmed). Two deliberate deviations remain:

1. **Photo cover scrim.** Cards whose cover is a photo keep a `from-black/80` gradient behind the white title (`src/pages/kanban/KanbanCard.tsx`). It is functional, for legibility on arbitrary photos, not decoration. Color covers are already a flat band.
2. **Board color fills the kanban canvas.** The board's chosen color or image paints the whole board page (`src/pages/kanban/Kanban.tsx`). It is the user's own choice and the only place a board's identity shows at scale. Columns, cards and header sit on paper surfaces above it.
