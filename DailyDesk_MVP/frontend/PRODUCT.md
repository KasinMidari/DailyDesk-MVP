# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individuals managing their own work: each person signs in with their own account and sees only their own boards and tasks. (Inferred from the course brief "Website quản lý công việc cá nhân" — independent multi-user accounts, not team collaboration.)

The product is also a graded one-week MVP submission, so evaluators are a second audience: they watch a 1–2 minute demo video, run the main flow end-to-end, and check that validation and error states work.

## Product Purpose

DailyDesk lets a person capture tasks, give each one a title, description, deadline and priority, move it through Todo / Doing / Done, and filter or sort by status or deadline. Success means the core flow (sign in → create → edit → change status → filter/sort → delete) runs end-to-end without confusion or dead ends.

## Operating Context

- Used on a laptop browser first; must stay usable at phone width.
- Frontend is being rebuilt against mock data first; the real backend (Hono + SQLite) will be written later by the user and plugged in behind the same data layer.
- Sign-in is Google-only (social login, as the brief recommends). Until the backend exists, sign-in is simulated.
- When signed out, the visitor sees only a compact sign-in screen — no marketing landing page.

## Capabilities and Constraints

- Kept from the existing app: Home with boards, Kanban board (lists and cards), All Tasks page with list and calendar views, card details (description, dates, labels, checklist, comments, cover), templates, profile, search, light/dark theme.
- Removed: the AI agent / chatbox and everything that only served it.
- Language: Vietnamese throughout the UI. Familiar product terms (Board, Task, Todo / Doing / Done) may stay as-is.
- Terminology: a "card" on a board is the user's task; status maps to Todo / Doing / Done.
- Undecided: final backend API shape; whether team/member features stay visible once the backend is written (the brief says to avoid group collaboration).

## Brand Commitments

- Name: DailyDesk. Logo: `public/logo-dailydesk.png`.
- Voice: plain, friendly Vietnamese; short sentences; no hype.

## Evidence on Hand

- Logo file above. No testimonials, user counts, customers, or press exist — do not fabricate any.
- The old landing page advertised features that do not exist (AI assistant, real-time collaboration, time tracking, automation); none of these may be claimed anywhere.

## Product Principles

1. The core task flow comes first; every screen should make the next action obvious.
2. Only claim what works. Anything not built is marked out of scope, never implied.
3. Every state is designed: loading, empty, error with retry, and success feedback.
4. Personal and private by default: one person, their own tasks.
