/**
 * Lớp đăng nhập của app.
 *
 * Mặc định: Google Identity Services → đổi ID token lấy session token của
 * backend qua `POST /auth/google`, lưu `{ token, user }` ở localStorage.
 * Khi `VITE_USE_MOCK=true` thì giữ bản giả lập cũ để demo offline.
 * API của hook giống `useAuth0` nên các chỗ gọi không phải đổi.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import getConfig from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { USE_MOCK } from "@/mocks/install";

export type AuthUser = {
  sub: string;
  name: string;
  email: string;
  nickname?: string;
  picture?: string;
};

type LogoutOptions = { logoutParams?: { returnTo?: string } };

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | undefined;
  loginWithRedirect: () => Promise<void>;
  logout: (options?: LogoutOptions) => void;
  getAccessTokenSilently: (options?: unknown) => Promise<string>;
  /** Thêm cho màn đăng nhập; không bắt buộc với các chỗ gọi cũ. */
  googleEnabled: boolean;
  renderGoogleButton: (el: HTMLElement) => Promise<void>;
  devLoginEnabled: boolean;
  loginWithDev: (email: string, name?: string) => Promise<void>;
  /** Callback của Google thất bại (nút chính thức không ném lỗi ra ngoài). */
  authFailed: boolean;
  /** Lý do đăng nhập hỏng, lấy từ máy chủ. */
  authError: string | null;
};

const SESSION_KEY = "dailydesk-session";
const GSI_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
/** Đăng nhập tài khoản thử nghiệm (`POST /auth/dev`); chỉ bật ở máy local. */
const DEV_LOGIN = import.meta.env.VITE_AUTH_DEV_LOGIN === "true";

export const DEMO_USER: AuthUser = {
  sub: "google-oauth2|demo-user",
  name: "Minh Anh",
  email: "minhanh.demo@gmail.com",
  nickname: "minhanh",
};

/** Token giả: backend giả đọc `sub` từ đây để biết ai đang gọi. */
export function tokenFor(user: AuthUser) {
  return `mock.${btoa(encodeURIComponent(user.sub))}`;
}

export function subFromToken(token: string | null | undefined) {
  if (!token?.startsWith("mock.")) return undefined;
  try {
    return decodeURIComponent(atob(token.slice(5)));
  } catch {
    return undefined;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ mock */

function readMockSession(): AuthUser | undefined {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as AuthUser | { user?: AuthUser };
    return "sub" in parsed ? parsed : parsed.user;
  } catch {
    return undefined;
  }
}

function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | undefined>(() => readMockSession());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giữ một nhịp ngắn để màn hình chờ không nháy.
    const t = window.setTimeout(() => setIsLoading(false), 150);
    return () => window.clearTimeout(t);
  }, []);

  const loginWithRedirect = useCallback(async () => {
    await new Promise((r) => window.setTimeout(r, 700));
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_USER));
    } catch {
      // Không lưu được phiên thì vẫn đăng nhập trong tab hiện tại.
    }
    setUser(DEMO_USER);
  }, []);

  const logout = useCallback((options?: LogoutOptions) => {
    clearUserData();
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("accessToken");
    } catch {
      // bỏ qua
    }
    setUser(undefined);
    const returnTo = options?.logoutParams?.returnTo;
    if (returnTo) window.location.assign(returnTo);
  }, []);

  const getAccessTokenSilently = useCallback(async () => {
    if (!user) throw new Error("Chưa đăng nhập");
    return tokenFor(user);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isLoading,
      user,
      loginWithRedirect,
      logout,
      getAccessTokenSilently,
      googleEnabled: false,
      renderGoogleButton: async () => {},
      devLoginEnabled: false,
      loginWithDev: async () => {},
      authFailed: false,
      authError: null,
    }),
    [user, isLoading, loginWithRedirect, logout, getAccessTokenSilently],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ thật */

type Session = { token: string; user: AuthUser };

type GoogleCredential = { credential?: string };
type GoogleId = {
  initialize: (o: {
    client_id: string;
    callback: (r: GoogleCredential) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (listener?: (n: GooglePromptNotification) => void) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
};
type GooglePromptNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getDismissedReason?: () => string;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

function readSession(): Session | undefined {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<Session>;
    return parsed?.token && parsed.user ? (parsed as Session) : undefined;
  } catch {
    return undefined;
  }
}

function writeSession(session: Session | undefined) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Không lưu được thì vẫn đăng nhập trong tab hiện tại.
  }
}

/** `{ id, name, email, picture }` của backend → hình dạng user của app. */
function toAuthUser(u: {
  id: string;
  name: string;
  email: string;
  picture?: string | null;
}): AuthUser {
  return {
    sub: u.id,
    name: u.name,
    email: u.email,
    nickname: u.email?.split("@")[0],
    picture: u.picture ?? undefined,
  };
}

async function postAuth(path: string, body: unknown): Promise<Session> {
  let res: Response;
  try {
    res = await fetch(`${getConfig().backendUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Không kết nối được máy chủ");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "Đăng nhập không thành công");
  return { token: data.token as string, user: toAuthUser(data.user) };
}

let gsiScript: Promise<void> | undefined;
function loadGsiScript() {
  gsiScript ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const el = document.createElement("script");
    el.src = GSI_SRC;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      gsiScript = undefined;
      reject(new Error("Không tải được Google Identity Services"));
    };
    document.head.appendChild(el);
  });
  return gsiScript;
}

/**
 * Xoá cache của React Query khi đăng xuất, để không để lại dữ liệu cho
 * người đăng nhập sau trên cùng máy. Việc làm mới khi đổi tài khoản nằm ở
 * AccessTokenProvider: phải đợi token mới rồi mới gọi lại API.
 */
function clearUserData() {
  queryClient.clear();
}

function RealAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | undefined>(() => readSession());
  const [isLoading, setIsLoading] = useState(true);
  const [authFailed, setAuthFailed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Lời hứa của lần bấm đăng nhập đang chờ callback của Google.
  const pending = useRef<{ resolve: () => void; reject: (e: Error) => void } | null>(null);
  const googleId = useRef<Promise<GoogleId> | null>(null);

  // Token cũ có thể đã hết hạn: hỏi lại /auth/me một lần khi mở app.
  useEffect(() => {
    const current = readSession();
    if (!current) {
      setIsLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${getConfig().backendUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${current.token}` },
        });
        if (!alive) return;
        if (res.status === 401) {
          writeSession(undefined);
          setSession(undefined);
        } else if (res.ok) {
          const me = await res.json();
          const next = { token: current.token, user: toAuthUser(me) };
          writeSession(next);
          setSession(next);
        }
      } catch {
        // Mạng lỗi: giữ phiên cũ, các request sau sẽ báo lỗi riêng.
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleCredential = useCallback(async (res: GoogleCredential) => {
    const waiting = pending.current;
    pending.current = null;
    try {
      if (!res.credential) throw new Error("Google không trả credential");
      const next = await postAuth("/auth/google", { credential: res.credential });
      writeSession(next);
      setSession(next);
      setAuthFailed(false);
      setAuthError(null);
      waiting?.resolve();
    } catch (e) {
      console.error("Đổi Google ID token thất bại", e);
      setAuthFailed(true);
      // Thông báo của máy chủ mới nói được hỏng ở đâu; nuốt nó đi thì người
      // dùng chỉ thấy một câu chung chung và không ai biết phải sửa gì.
      setAuthError(e instanceof Error && e.message ? e.message : null);
      waiting?.reject(e instanceof Error ? e : new Error("Đăng nhập không thành công"));
    }
  }, []);

  const ensureGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      return Promise.reject(new Error("Thiếu VITE_GOOGLE_CLIENT_ID"));
    }
    googleId.current ??= loadGsiScript().then(() => {
      const id = window.google?.accounts?.id;
      if (!id) throw new Error("Không tải được Google Identity Services");
      id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (r) => void handleCredential(r),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      return id;
    });
    return googleId.current.catch((e) => {
      googleId.current = null;
      throw e;
    });
  }, [handleCredential]);

  /** Nút Google chính thức; callback dùng chung với One Tap. */
  const renderGoogleButton = useCallback(
    async (el: HTMLElement) => {
      const id = await ensureGoogle();
      el.replaceChildren();
      id.renderButton(el, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        locale: "vi",
        width: Math.min(Math.max(el.clientWidth || 320, 200), 400),
      });
    },
    [ensureGoogle],
  );

  const loginWithRedirect = useCallback(async () => {
    const id = await ensureGoogle();
    await new Promise<void>((resolve, reject) => {
      pending.current = { resolve, reject };
      id.prompt((n) => {
        if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
          const waiting = pending.current;
          pending.current = null;
          waiting?.reject(new Error("Google không hiện được hộp đăng nhập"));
        }
      });
    });
  }, [ensureGoogle]);

  const loginWithDev = useCallback(async (email: string, name?: string) => {
    const next = await postAuth("/auth/dev", { email, name });
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback((options?: LogoutOptions) => {
    clearUserData();
    writeSession(undefined);
    try {
      localStorage.removeItem("accessToken");
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      // bỏ qua
    }
    setSession(undefined);
    const returnTo = options?.logoutParams?.returnTo;
    if (returnTo) window.location.assign(returnTo);
  }, []);

  const getAccessTokenSilently = useCallback(async () => {
    const token = session?.token ?? readSession()?.token;
    if (!token) throw new Error("Chưa đăng nhập");
    return token;
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!session,
      isLoading,
      user: session?.user,
      loginWithRedirect,
      logout,
      getAccessTokenSilently,
      googleEnabled: !!GOOGLE_CLIENT_ID,
      renderGoogleButton,
      devLoginEnabled: DEV_LOGIN,
      loginWithDev,
      authFailed,
      authError,
    }),
    [
      session,
      isLoading,
      authFailed,
      authError,
      loginWithRedirect,
      logout,
      getAccessTokenSilently,
      renderGoogleButton,
      loginWithDev,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return USE_MOCK ? (
    <MockAuthProvider>{children}</MockAuthProvider>
  ) : (
    <RealAuthProvider>{children}</RealAuthProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}

/** Giữ tên cũ để các component hiện có không phải đổi cách gọi. */
export const useAuth0 = useAuth;
