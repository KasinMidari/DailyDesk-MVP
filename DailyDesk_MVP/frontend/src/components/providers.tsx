import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/lib/auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import AccessTokenProvider from "./access-token-provider";
import store from "@/stores/store";
import { queryClient } from "@/lib/query-client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider store={store}>
      <ThemeProvider defaultTheme="light" storageKey="dailydesk-theme">
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AccessTokenProvider>{children}</AccessTokenProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}
