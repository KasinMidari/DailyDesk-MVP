import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import Providers from "./components/providers";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PageLoader from "./components/full-page-loader";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        {/* h-dvh: thanh công cụ động của Safari/Chrome mobile không cắt mất đáy. */}
        <main className="flex h-dvh w-full flex-col overflow-hidden bg-background">
          {/* Header: nút thu gọn sidebar, tìm kiếm, tài khoản, sáng/tối */}
          <div className="sticky top-0 right-0 z-50 flex w-full items-center justify-between gap-2 bg-background/80 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <SidebarTrigger />
              <GlobalSearch />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <UserMenu />
              <ThemeToggle />
            </div>
          </div>

          <ErrorBoundary
            fallback={
              <div className="flex h-full w-full items-center justify-center">Có lỗi xảy ra</div>
            }
          >
            <Suspense fallback={<PageLoader />}>
              <Toaster />
              <div className="flex-1 overflow-y-auto">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </SidebarProvider>
    </Providers>
  );
}
