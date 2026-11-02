---
version: 1
slug: "src-features-tasks-tasks-page-tsx"
primary_target: "src/features/tasks/tasks-page.tsx"
related_targets: ["src/components/sign-in-screen.tsx"]
---

Scope: whole signed-in app (Việc của tôi, Lịch, Board, card dialog) plus sign-in. Mode: Operate.
Audience: Vietnamese students and office workers managing their own tasks; graders of a one-week MVP.
Task: capture tasks, set deadline and priority, move Todo → Doing → Done, filter and sort.

## Direction contract
THESIS: The app is an office file folder. Status tabs are folder index tabs joined to the drawer below; each task is a ruled form line. Refuses the category default of card grids, hero metrics, gradients and glass.
OWN-WORLD: Cool office-paper ground (oklch 0.982 0.004 240), navy ink for text and the one primary action, three tab hues (blue Todo, manila amber Doing, green Done) and three priority marks (red, amber, slate square). Be Vietnam Pro, tabular figures for dates. 0.5rem radius, hairline borders, one soft drawer shadow.
STORY: The visitor sees what is overdue and what is next, changes status in one click, and adds a task with only a title required.
FIRST VIEWPORT: Left sidebar (Việc của tôi / Lịch / Board). Header: date line, H1 "Việc của tôi", open/overdue counts, navy "Thêm task" button with N shortcut at right. Below: folder tabs, then the drawer with search, priority/board/sort pills, column header, deadline groups.
FORM: Office file folder with ruled rows; grounded candidate 6 of 7; raise from the gate-board challenger: a changed row stays lit until noticed and deadline orders everything. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
