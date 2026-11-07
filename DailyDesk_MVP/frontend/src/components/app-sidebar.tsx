import { LogOut, Moon, Search, Sun } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import TemplateGalleryDialog from "@/components/template-gallery-dialog";
import { GlobalSearch } from "@/components/global-search";
import { useTheme } from "@/components/theme-provider";
import { useAuth0 } from "@/lib/auth";
import { SHOW_TEMPLATES } from "@/lib/features";
import { BrandMark } from "@/components/brand-mark";

const main = [
  { title: "Việc của tôi", url: "/", match: (p: string) => p === "/" },
  { title: "Lịch", url: "/lich", match: (p: string) => p.startsWith("/lich") },
  { title: "Board", url: "/boards", match: (p: string) => p.startsWith("/boards") || p.startsWith("/board/") },
];

/* Mục đang mở: nền giấy đậm hơn một bậc, chữ đậm hơn — không màu, không vạch
   bên trái. Vạch mực bên trái chỉ xuất hiện 1 lần trong 23 màn sản phẩm thật;
   điều hướng phải lùi lại để màu còn dành cho dữ liệu. */
const itemClass =
  "h-9 rounded-md px-3 text-[14px] font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold";

/** Gáy sổ: điều hướng, tìm kiếm, tài khoản và đổi giao diện. */
export function AppSidebar() {
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth0();
  const { theme, toggleTheme } = useTheme();
  const { setOpenMobile } = useSidebar();
  const isDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const close = () => setOpenMobile(false);

  // Gáy sổ là một bậc giấy đậm hơn ở mép phải, không phải vạch mực: màu nhấn
  // để dành cho dữ liệu, còn gáy thì đọc ra từ cấu trúc.
  return (
    <Sidebar className="shadow-[inset_-3px_0_0_var(--rule)]">
      <SidebarHeader className="px-4 pt-5 pb-3">
        {/* Nhãn vở dán trên gáy */}
        <Link
          to="/"
          onClick={close}
          className="block rounded-md border border-sidebar-border bg-card px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex items-center gap-2">
            <BrandMark className="size-7 text-ink" />
            <span className="text-[17px] font-semibold leading-none text-ink">DailyDesk</span>
          </span>
          {user?.name && (
            <span className="mt-2 block truncate border-t border-sidebar-border pt-1.5 text-xs text-muted-foreground">
              Sổ của {user.name}
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="gap-0.5 px-2">
          {main.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={item.match(pathname)} className={itemClass}>
                <Link to={item.url} onClick={close}>
                  {item.title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {SHOW_TEMPLATES && (
            <SidebarMenuItem>
              <SidebarMenuButton className={itemClass} onClick={() => setIsTemplateGalleryOpen(true)}>
                Mẫu board
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        <div className="mx-2 mt-4 border-t border-sidebar-border pt-4">
          <GlobalSearch
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                title="Tìm nhanh (Ctrl + K)"
                className="flex h-9 w-full items-center gap-2 rounded-md border border-sidebar-border px-3 text-left text-[13px] text-sidebar-foreground/75 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <Search className="size-4" aria-hidden="true" />
                Tìm trong sổ…
              </button>
            )}
          />
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-sidebar-border px-4 py-3">
        <Link
          to="/profile"
          onClick={close}
          data-active={pathname.startsWith("/profile")}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-accent"
        >
          {user?.picture ? (
            <img src={user.picture} alt="" className="size-7 rounded-full object-cover" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-medium text-sidebar-accent-foreground">{user?.name ?? "Hồ sơ"}</span>
            <span className="block text-xs text-sidebar-foreground/70">Hồ sơ</span>
          </span>
        </Link>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 flex-1 items-center gap-2 rounded-md px-2 text-[13px] text-sidebar-foreground/80 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
            {isDark ? "Nền sáng" : "Nền tối"}
          </button>
          <button
            type="button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="grid size-8 place-items-center rounded-md text-sidebar-foreground/80 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </SidebarFooter>

      {SHOW_TEMPLATES && (
        <TemplateGalleryDialog open={isTemplateGalleryOpen} onOpenChange={setIsTemplateGalleryOpen} />
      )}
    </Sidebar>
  );
}
