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

**Key Characteristics:**
- Cool blue-grey paper ground, white sheets, navy ink; color reserved for status and priority.
- Folder index tabs with a 3px colored lip, joined to a bordered drawer.
- Ruled task rows divided by hairlines, grouped under sticky deadline headers.
- Be Vietnam Pro throughout; tabular figures for every date, time, and count.
- Gentle 8px corners, hairline borders, one soft drawer shadow.

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

## Do's and Don'ts

### Do:
- **Do** join status tabs to the drawer with the -1px overlap and a 3px status lip on the active tab.
- **Do** use the shared date helpers and tabular figures for every date, time, and count.
- **Do** keep one filled navy button per view and make everything else outline or ghost.
- **Do** mark priority with the 10px square and status with dots or pills, colored only from the status and priority tokens.
- **Do** flash a changed row in the manila wash so the change is noticed, and respect reduced motion for any added animation.
- **Do** design every list state: skeleton rows, empty with a first action, filtered-empty with a reset, error with "Thử lại".

### Don't:
- **Don't** lay tasks out as a grid of cards, or add hero metrics, gradients, or glass panels.
- **Don't** use a status hue (blue, amber, green) for anything that is not that status.
- **Don't** add a second resting shadow beside the drawer, or heavier shadows than the drawer's.
- **Don't** introduce a second typeface or uppercase tracked labels.
- **Don't** pull the manila sign-in palette into the signed-in app; it is scoped to sign-in.
