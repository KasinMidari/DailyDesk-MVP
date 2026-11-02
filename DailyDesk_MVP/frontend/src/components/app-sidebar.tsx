import { CalendarDays, Kanban, LayoutTemplate, ListChecks, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import TemplateGalleryDialog from "@/components/template-gallery-dialog";

const main = [
  { title: "Việc của tôi", url: "/", icon: ListChecks, match: (p: string) => p === "/" },
  { title: "Lịch", url: "/lich", icon: CalendarDays, match: (p: string) => p.startsWith("/lich") },
  {
    title: "Board",
    url: "/boards",
    icon: Kanban,
    match: (p: string) => p.startsWith("/boards") || p.startsWith("/board/"),
  },
];

export function AppSidebar() {
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link to="/" className="flex items-center gap-2.5 rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <img src="/logo-dailydesk.png" alt="" className="size-9 rounded-md bg-white object-contain" />
          <span className="text-[15px] font-semibold tracking-tight">DailyDesk</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.match(pathname)} className="h-9 font-medium">
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Khác</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setIsTemplateGalleryOpen(true)}>
                  <LayoutTemplate />
                  <span>Mẫu board</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith("/profile")}>
              <Link to="/profile">
                <UserRound />
                <span>Hồ sơ</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <TemplateGalleryDialog open={isTemplateGalleryOpen} onOpenChange={setIsTemplateGalleryOpen} />
    </Sidebar>
  );
}
