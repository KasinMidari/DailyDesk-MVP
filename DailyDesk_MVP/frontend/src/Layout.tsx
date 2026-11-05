import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import Providers from "./components/providers";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PageLoader from "./components/full-page-loader";
import { Toaster } from "@/components/ui/sonner";

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        {/* h-dvh: thanh công cụ động của Safari/Chrome mobile không cắt mất đáy. */}
        <main className="flex h-dvh w-full flex-col overflow-hidden bg-background">
          {/* Chỉ trên màn hẹp: nút mở bìa sổ */}
          <div className="flex items-center gap-2 border-b bg-background px-3 py-2 md:hidden">
            <SidebarTrigger aria-label="Mở menu" />
            <span className="font-planner text-base font-semibold">DailyDesk</span>
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
