/**
 * Lớp đăng nhập của app.
 *
 * Hiện tại là bản giả lập (mock) để chạy frontend khi chưa có backend:
 * bấm "Tiếp tục với Google" sẽ đăng nhập bằng một tài khoản demo.
 * API của hook giống `useAuth0` nên khi có backend thật chỉ cần thay
 * phần cài đặt bên trong file này.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
};

const SESSION_KEY = "dailydesk-session";

export const DEMO_USER: AuthUser = {
  sub: "google-oauth2|demo-user",
  name: "Minh Anh",
  email: "minhanh.demo@gmail.com",
  nickname: "minhanh",
};

function readSession(): AuthUser | undefined {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : undefined;
  } catch {
    return undefined;
  }
}

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | undefined>(() => readSession());
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
    }),
    [user, isLoading, loginWithRedirect, logout, getAccessTokenSilently],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong <AuthProvider>");
  return ctx;
}

/** Giữ tên cũ để các component hiện có không phải đổi cách gọi. */
export const useAuth0 = useAuth;
