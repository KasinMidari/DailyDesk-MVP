import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { USE_MOCK } from "@/mocks/install";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

/** Các tài khoản `pnpm db:seed` tạo sẵn. Gõ email khác vẫn vào được. */
const DEV_ACCOUNTS = [
  { email: "dev@dailydesk.local", name: "Người dùng thử nghiệm" },
  { email: "an@dailydesk.local", name: "Nguyễn Văn An" },
  { email: "binh@dailydesk.local", name: "Trần Thị Bình" },
] as const;

export default function SignInScreen() {
  const {
    loginWithRedirect,
    googleEnabled,
    renderGoogleButton,
    devLoginEnabled,
    loginWithDev,
    authFailed,
    authError,
  } = useAuth();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState<string>(DEV_ACCOUNTS[0].email);
  const googleSlot = useRef<HTMLDivElement | null>(null);

  // Không có Client ID thì nút Google chỉ có thể hỏng. Bản demo dùng dữ liệu
  // mock nên nút giả ở đó vẫn đăng nhập được — chỉ chặn khi nối backend thật.
  const googleUnconfigured = !USE_MOCK && !googleEnabled;

  /** Nói đúng chỗ hỏng: máy chủ chưa chạy khác với thiếu cấu hình khác với mạng. */
  const reasonOf = (e: unknown) => {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("VITE_GOOGLE_CLIENT_ID")) {
      return "Chưa cấu hình đăng nhập Google (thiếu VITE_GOOGLE_CLIENT_ID). Dùng tài khoản thử nghiệm hoặc đặt Client ID trong .env.local.";
    }
    if (msg.includes("Không kết nối được máy chủ")) {
      return "Không gọi được máy chủ. Kiểm tra backend đã chạy chưa (pnpm --dir DailyDesk_MVP/backend dev).";
    }
    return msg || "Không đăng nhập được. Thử lại sau giây lát.";
  };

  // Backend thật: dùng nút Google chính thức thay nút giả.
  useEffect(() => {
    const el = googleSlot.current;
    if (!googleEnabled || !el) return;
    renderGoogleButton(el).catch((e) => setFailed(reasonOf(e)));
  }, [googleEnabled, renderGoogleButton]);

  async function signIn() {
    setPending(true);
    setFailed(null);
    try {
      await loginWithRedirect();
    } catch (e) {
      setFailed(reasonOf(e));
      setPending(false);
    }
  }

  async function signInDev() {
    const email = devEmail.trim() || DEV_ACCOUNTS[0]!.email;
    setPending(true);
    setFailed(null);
    try {
      // Email có trong `pnpm db:seed` thì vào thấy dữ liệu mẫu ngay; email lạ
      // thì backend tạo tài khoản mới kèm board "Việc của tôi" rỗng.
      await loginWithDev(email, DEV_ACCOUNTS.find((a) => a.email === email)?.name);
    } catch (e) {
      setFailed(reasonOf(e));
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh w-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2">
          <img
            src="/logo-dailydesk.png"
            alt="DailyDesk"
            className="h-10 w-10 rounded-md object-contain"
          />
          <span className="text-lg font-semibold">DailyDesk</span>
        </span>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>
              Ghi việc, đặt hạn và mức ưu tiên, rồi tick dần từ Todo sang Done.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            {googleEnabled ? (
              <div ref={googleSlot} className="flex min-h-12 justify-center [color-scheme:light]" />
            ) : (
              <button
                type="button"
                onClick={signIn}
                disabled={pending || googleUnconfigured}
                aria-describedby={googleUnconfigured ? "google-note" : undefined}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : (
                  <GoogleMark />
                )}
                {pending ? "Đang kết nối với Google…" : "Tiếp tục với Google"}
              </button>
            )}

            {googleUnconfigured && (
              <p id="google-note" className="text-sm text-muted-foreground">
                Chưa đặt <code>VITE_GOOGLE_CLIENT_ID</code> nên chưa đăng nhập Google được. Dùng tài
                khoản thử nghiệm bên dưới.
              </p>
            )}

            {devLoginEnabled && (
              <div className="grid gap-2 rounded-md border border-dashed border-input p-3">
                <label htmlFor="dev-email" className="text-xs font-medium text-muted-foreground">
                  Tài khoản thử nghiệm
                </label>
                <input
                  id="dev-email"
                  type="email"
                  list="dev-accounts"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !pending) signInDev();
                  }}
                  placeholder="email@vi-du.com"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <datalist id="dev-accounts">
                  {DEV_ACCOUNTS.map((a) => (
                    <option key={a.email} value={a.email}>
                      {a.name}
                    </option>
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={signInDev}
                  disabled={pending}
                  className="flex h-9 w-full items-center justify-center rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-wait disabled:opacity-80"
                >
                  Đăng nhập
                </button>
                <p className="text-xs text-muted-foreground">
                  Ba email mẫu có sẵn dữ liệu. Gõ email bất kỳ để vào như người dùng mới — tài khoản
                  được tạo tự động với một board trống.
                </p>
              </div>
            )}

            {(failed || authFailed) && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {failed ?? authError ?? "Không đăng nhập được. Thử lại sau giây lát."}
              </p>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              Lần đầu dùng? Tài khoản được tạo tự động khi bạn đăng nhập. Mỗi tài khoản chỉ thấy việc
              của chính mình.
            </p>

            {USE_MOCK && (
              <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                Bản demo: chưa kết nối backend, nút trên đăng nhập bằng một tài khoản thử nghiệm và dữ
                liệu được lưu trong trình duyệt này.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
