import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { USE_MOCK } from "@/mocks/install";
import { ThemeToggle } from "@/components/theme-toggle";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

const PREVIEW_TASKS = [
  { title: "Nộp báo cáo đồ án", due: "Hôm nay, 17:00", priority: "Cao", status: "doing" as const },
  { title: "Ôn tập Cấu trúc dữ liệu", due: "Thứ Sáu", priority: "Vừa", status: "todo" as const },
  { title: "Đóng tiền điện", due: "Đã xong hôm qua", priority: "Thấp", status: "done" as const },
];

const STATUS_LABEL = { todo: "Todo", doing: "Doing", done: "Done" };

/** Bản xem trước tĩnh: chỉ minh hoạ những gì app thật sự làm được. */
function TaskPreview() {
  return (
    <div aria-hidden="true" className="signin-preview w-full max-w-sm">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <span className="text-sm font-semibold text-(--signin-ink)">Việc của tôi</span>
        <span className="text-xs tabular-nums text-(--signin-ink-soft)">3 task</span>
      </div>
      <ul className="divide-y divide-(--signin-line) overflow-hidden rounded-xl bg-(--signin-sheet) shadow-[0_18px_40px_-18px_var(--signin-shadow)] ring-1 ring-(--signin-line)">
        {PREVIEW_TASKS.map((task) => (
          <li
            key={task.title}
            data-status={task.status}
            className="signin-task flex items-center gap-3 px-4 py-3.5"
          >
            <span className="signin-check grid size-5 shrink-0 place-items-center rounded-full border-2">
              <svg viewBox="0 0 16 16" className="size-3" fill="none">
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="signin-title block truncate text-sm font-medium text-(--signin-ink)">
                {task.title}
              </span>
              <span className="block text-xs text-(--signin-ink-soft)">
                {task.due} · Ưu tiên {task.priority.toLowerCase()}
              </span>
            </span>
            <span className="signin-pill rounded-full px-2 py-0.5 text-[11px] font-semibold">
              <span className="signin-pill-from">{STATUS_LABEL[task.status]}</span>
              <span className="signin-pill-to">Done</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SignInScreen() {
  const { loginWithRedirect } = useAuth();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signIn() {
    setPending(true);
    setFailed(false);
    try {
      await loginWithRedirect();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="signin grid min-h-svh w-full bg-background text-foreground md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight">DailyDesk</span>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-sm">
            <img
              src="/logo-dailydesk.png"
              alt="DailyDesk"
              width={112}
              height={112}
              className="-ml-2 mb-6 size-28 rounded-2xl object-contain"
            />
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Đăng nhập để xem việc của bạn
            </h1>
            <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Ghi lại task, đặt hạn và mức ưu tiên, rồi chuyển dần từ Todo sang Done.
            </p>

            <button
              type="button"
              onClick={signIn}
              disabled={pending}
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-input bg-card px-4 text-[15px] font-medium text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-accent hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:cursor-wait disabled:opacity-80"
            >
              {pending ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <GoogleMark />
              )}
              {pending ? "Đang kết nối với Google…" : "Tiếp tục với Google"}
            </button>

            {failed && (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Không đăng nhập được. Kiểm tra kết nối mạng rồi bấm lại nút ở trên.
              </p>
            )}

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Lần đầu dùng? Tài khoản được tạo tự động khi bạn đăng nhập. Mỗi tài khoản chỉ thấy task của chính mình.
            </p>

            {USE_MOCK && (
              <p className="mt-8 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                Bản demo: chưa kết nối backend, nút trên đăng nhập bằng một tài khoản thử nghiệm và dữ liệu
                được lưu trong trình duyệt này.
              </p>
            )}
          </div>
        </div>
      </section>

      <aside className="signin-panel relative hidden items-center justify-center overflow-hidden px-10 py-16 md:flex">
        <div className="relative flex w-full flex-col items-center gap-10">
          <p className="max-w-sm text-balance text-center text-2xl font-semibold leading-snug tracking-tight text-(--signin-ink)">
            Biết ngay việc nào cần làm trước.
          </p>
          <TaskPreview />
        </div>
      </aside>
    </div>
  );
}
