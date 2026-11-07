import { Calendar, CheckSquare, LayoutDashboard, LayoutTemplate } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import TemplateGalleryDialog from "@/components/template-gallery-dialog";
import { SHOW_TEMPLATES } from "@/lib/features";

const items = [
  {
    title: "Việc của tôi",
    url: "/",
    icon: CheckSquare,
    match: (p: string) => p === "/",
  },
  {
    title: "Lịch",
    url: "/lich",
    icon: Calendar,
    match: (p: string) => p.startsWith("/lich"),
  },
  {
    title: "Board",
    url: "/boards",
    icon: LayoutDashboard,
    match: (p: string) => p.startsWith("/boards") || p.startsWith("/board/"),
  },
];

export function AppSidebar() {
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const close = () => setOpenMobile(false);

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link to="/" onClick={close} className="flex items-center gap-2">
          <img
            src="/logo-dailydesk.png"
            alt="DailyDesk"
            className="h-12 w-12 rounded-md object-contain"
          />
          <span className="text-lg font-semibold">DailyDesk</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.match(pathname)}>
                    <Link to={item.url} onClick={close} className="flex items-center gap-3">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {SHOW_TEMPLATES && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setIsTemplateGalleryOpen(true)}>
                    <LayoutTemplate />
                    <span>Mẫu board</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {SHOW_TEMPLATES && (
        <TemplateGalleryDialog
          open={isTemplateGalleryOpen}
          onOpenChange={setIsTemplateGalleryOpen}
        />
      )}
    </Sidebar>
  );
}
