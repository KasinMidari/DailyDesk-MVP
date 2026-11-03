---
version: 1
slug: "src-features-tasks-tasks-page-tsx"
primary_target: "src/features/tasks/tasks-page.tsx"
related_targets: ["src/components/sign-in-screen.tsx"]
---

Scope: whole signed-in app (Việc của tôi, Lịch, Board, card dialog, Hồ sơ, Mẫu board) plus sign-in. Mode: Operate.
Audience: Vietnamese students and office workers managing their own tasks; graders of a one-week MVP.
Task: capture tasks, set deadline and priority, move Todo → Doing → Done, filter and sort.
Constraint: user pinned the world "Sổ kế hoạch giấy" (warm paper, serif headings, ruled day groups, tick boxes and stamps). Light is the default theme; dark stays as an option.

## Direction contract
THESIS: The app is a Vietnamese school/office planner: a notebook cover holds the navigation, pages are warm paper, tasks are lines grouped by day, and finishing a task stamps it. Refuses the shadcn dashboard default: dark slate ground, Ctrl K pill, kbd chips on buttons, pill status badges, grey icon sidebar.
OWN-WORLD: Warm paper ground (oklch 0.978 0.01 85) with a faint red margin rule on the list; mực tím ink (oklch 0.36 0.13 292) for the cover rail, primary action and links; graphite text; red-ink (oklch 0.55 0.18 25) for overdue and the XONG stamp; highlighter marks for priority (Cao pink-red swipe, Vừa yellow swipe, Thấp plain). Literata for page and group headings, Be Vietnam Pro for everything else, tabular dates. 6px radius, hairline rules, no glass, no gradients.
STORY: The visitor opens to today's page, sees what is late and what is due, ticks a box to move Todo → Doing → Done, and adds a task with only a title required.
FIRST VIEWPORT: Left violet cover rail (DailyDesk, Việc của tôi / Lịch / Board / Mẫu board, Hồ sơ at the foot). Page header: Literata H1 "Việc của tôi", date line "Thứ Tư, 4 tháng 11", counts, ink "Ghi việc mới" button at right. Text tabs Tất cả · Cần làm · Đang làm · Đã xong with counts, a plain search field and filter selects, then the day-grouped ruled list with the margin rule.
FORM: Planner page; status box cycles empty → half-filled (Doing) → ticked (Done) with a red round XONG stamp pressed onto the row (signature move, 200ms press). seed: none (direction pinned by user; no roll)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
