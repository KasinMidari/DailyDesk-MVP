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

type PreviewStatus = "todo" | "doing" | "done";
const PREVIEW: { day: string; tasks: { title: string; time: string; prio?: "high" | "medium"; status: PreviewStatus; stampIn?: boolean }[] }[] = [
  {
    day: "Hôm nay",
    tasks: [
      { title: "Nộp báo cáo đồ án", time: "17:00", prio: "high", status: "doing", stampIn: true },
      { title: "Đóng tiền điện", time: "20:00", status: "done" },
    ],
  },
  {
    day: "Thứ Sáu",
    tasks: [{ title: "Ôn tập Cấu trúc dữ liệu", time: "09:00", prio: "medium", status: "todo" }],
  },
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Bản xem trước tĩnh của một trang sổ: chỉ minh hoạ những gì app làm được. */
function PlannerPreview() {
  return (
    <div aria-hidden="true" className="planner-page signin-preview w-full max-w-sm rounded-md py-4 shadow-[0_24px_50px_-24px_oklch(0.1_0.05_292/0.7)]">
      {PREVIEW.map((g) => (
        <div key={g.day} className="mb-2 last:mb-0">
          <p className="font-planner pr-5 pb-1 pl-16 text-[15px] font-semibold">{g.day}</p>
          <ul className="border-t">
            {g.tasks.map((t) => (
              <li key={t.title} data-status={t.status} className="signin-row flex h-11 items-center gap-3 border-b pr-4 pl-4">
                <span className="status-box signin-box" data-status={t.status}>
                  {t.status === "done" && <Check />}
                  {t.stampIn && <span className="signin-box-check"><Check /></span>}
                </span>
                <span className="ml-5 min-w-0 flex-1 truncate text-sm">
                  <span className={t.status === "done" ? "text-muted-foreground line-through" : "signin-title"}>{t.title}</span>
                </span>
                {t.status === "done" ? (
                  <span className="stamp">XONG</span>
                ) : t.stampIn ? (
                  <span className="stamp signin-stamp">XONG</span>
                ) : null}
                {t.prio && !t.stampIn && (
                  <span className={`hl text-xs font-medium ${t.prio === "high" ? "hl-high" : "hl-medium"}`}>
                    {t.prio === "high" ? "Cao" : "Vừa"}
                  </span>
                )}
                <span className="w-10 text-right text-xs tabular text-muted-foreground">{t.time}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
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
    <div className="grid min-h-svh w-full bg-background text-foreground md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <img src="/logo-dailydesk.png" alt="" className="size-8 object-contain" />
            <span className="font-planner text-lg font-semibold">DailyDesk</span>
          </span>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-sm">
            <h1 className="font-planner text-balance text-[2.25rem] leading-[1.15] font-semibold sm:text-[2.6rem]">
              Mở sổ, xem hôm nay cần làm gì.
            </h1>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Ghi việc, đặt hạn và mức ưu tiên, rồi tick dần từ Todo sang Done.
            </p>

            <button
              type="button"
              onClick={signIn}
              disabled={pending}
              className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-input bg-card px-4 text-[15px] font-medium text-card-foreground shadow-[0_1px_2px_oklch(0.3_0.05_80/0.12)] transition-[background-color,transform] duration-150 ease-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:cursor-wait disabled:opacity-80"
            >
              {pending ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <GoogleMark />
              )}
              {pending ? "Đang kết nối với Google…" : "Tiếp tục với Google"}
            </button>

            {failed && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Không đăng nhập được. Kiểm tra kết nối mạng rồi bấm lại nút ở trên.
              </p>
            )}

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Lần đầu dùng? Tài khoản được tạo tự động khi bạn đăng nhập. Mỗi tài khoản chỉ thấy việc của chính mình.
            </p>

            {USE_MOCK && (
              <p className="mt-8 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                Bản demo: chưa kết nối backend, nút trên đăng nhập bằng một tài khoản thử nghiệm và dữ liệu được lưu
                trong trình duyệt này.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Bìa sổ mực tím, kẹp một trang xem trước */}
      <aside className="hidden items-center justify-center bg-sidebar px-10 py-16 md:flex">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <p className="font-planner text-balance text-2xl leading-snug font-semibold text-sidebar-accent-foreground">
            Việc trễ hiện trước, việc xong được đóng dấu.
          </p>
          <PlannerPreview />
        </div>
      </aside>
    </div>
  );
}
