import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router";
import Providers from "./components/providers";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import PageLoader from "./components/full-page-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearch } from "@/components/global-search";

export default function Layout() {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col w-full h-screen bg-background overflow-hidden">
          {/* Header with Search Bar */}
          <div className="sticky top-0 right-0 flex items-center justify-between gap-3 px-3 py-2 z-50 sm:px-6 border-b bg-background/80 backdrop-blur-sm w-full">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <SidebarTrigger />
            <GlobalSearch />
            </div>
            <div className="flex items-center gap-3" >
              <UserMenu /> 
              <ThemeToggle />
            </div>
        
          </div>

          <ErrorBoundary
            fallback={
              <div className="flex justify-center items-center w-full h-full">
                Có lỗi xảy ra
              </div>
            }
          >
            <Suspense fallback={<PageLoader />}>
              <Toaster richColors />
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
