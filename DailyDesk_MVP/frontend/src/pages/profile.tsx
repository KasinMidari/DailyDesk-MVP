import { useState, useEffect } from "react";
import { useAuth0 } from "@/lib/auth";
import { useAtom } from "jotai";
import { boardCardStyleAtom, userPreferencesAtom, type BoardCardStyle } from "@/stores/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Bell, 
  Moon, 
  Globe, 
  Lock,
  Trash2,
  Save,
  Camera,
  LayoutGrid
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useSearchParams } from "react-router";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { cn } from "@/lib/utils";

/** Hai kiểu card ở danh sách board, kèm bản xem trước vẽ bằng div. */
const BOARD_CARD_STYLES: {
  value: BoardCardStyle;
  label: string;
  hint: string;
  preview: React.ReactNode;
}[] = [
  {
    value: "band",
    label: "Dải ảnh + thông tin",
    hint: "Ảnh hoặc màu ở trên, tên và số task ở dưới nền giấy.",
    preview: (
      <div aria-hidden="true" className="overflow-hidden rounded-lg border">
        <div className="h-8 bg-gradient-to-r from-sky-400 to-indigo-400" />
        <div className="space-y-1.5 bg-card p-2">
          <div className="h-2 w-2/3 rounded bg-foreground/70" />
          <div className="h-1.5 w-full rounded bg-muted-foreground/30" />
        </div>
      </div>
    ),
  },
  {
    value: "cover",
    label: "Ảnh phủ kín",
    hint: "Ảnh hoặc màu chiếm cả card, tên chữ trắng đè lên trên.",
    preview: (
      <div
        aria-hidden="true"
        className="relative flex h-[4.25rem] flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 p-2"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative space-y-1.5">
          <div className="h-2 w-2/3 rounded bg-white/90" />
          <div className="h-1.5 w-full rounded bg-white/50" />
        </div>
      </div>
    ),
  },
];

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth0();
  const { theme, setTheme } = useTheme();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [searchParams] = useSearchParams();
  const [preferences, setPreferences] = useAtom(userPreferencesAtom);
  const [boardCardStyle, setBoardCardStyle] = useAtom(boardCardStyleAtom);
  
  // Get active tab from URL params
  const activeTab = searchParams.get("tab") || "profile";
  
  // Profile form state
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");

  // Sync preferences with local state
  useEffect(() => {
    // This ensures the component re-renders when preferences change
  }, [preferences]);

  const handleSaveProfile = () => {
    // In a real app, this would call an API to update the user profile
    toast.success("Cập nhật thông tin thành công");
  };

  const updateNotificationPreference = (key: keyof typeof preferences.notifications, value: boolean) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    });
    toast.success("Cài đặt đã được lưu");
  };

  const updateLanguage = (lang: string) => {
    setPreferences({ ...preferences, language: lang });
    toast.info("Chức năng đổi ngôn ngữ đang được phát triển");
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: "Xóa tài khoản",
      description: "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive"
    });
    if (confirmed) {
      // In a real app, this would call an API to delete the account
      toast.error("Chức năng xóa tài khoản đang được phát triển");
    }
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="a{activeTab}in rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-8 pb-16 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
            {/* Nói về TÀI KHOẢN, không mô tả giao diện. */}
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="profile">Thông tin</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="text-xl">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() => toast.info("Chức năng đổi ảnh đại diện đang được phát triển")}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              {/* Ô nhập một dòng không kéo hết 1000px: mắt phải chạy từ nhãn
                  sang tận mép phải để biết mình đang gõ vào đâu. */}
              <div className="max-w-xl space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Tên hiển thị</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email lấy từ tài khoản Google và không thể thay đổi ở đây
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId">ID người dùng</Label>
                  <Input
                    id="userId"
                    value={user?.sub || ""}
                    disabled
                    className="bg-muted font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDisplayName(user?.name || "")}>
                  Hủy
                </Button>
                <Button onClick={handleSaveProfile}>Lưu thay đổi</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Thông báo
              </CardTitle>
              <CardDescription>
                Quản lý cách bạn nhận thông báo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Thông báo qua Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo qua email về hoạt động quan trọng
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.notifications.email}
                  onCheckedChange={(value) => updateNotificationPreference("email", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Thông báo đẩy</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo trên trình duyệt
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.notifications.push}
                  onCheckedChange={(value) => updateNotificationPreference("push", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-reminders">Nhắc nhở công việc</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận nhắc nhở về công việc được giao
                  </p>
                </div>
                <Switch
                  id="task-reminders"
                  checked={preferences.notifications.taskReminders}
                  onCheckedChange={(value) => updateNotificationPreference("taskReminders", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="due-date-reminders">Nhắc nhở hạn chót</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo khi công việc sắp đến hạn
                  </p>
                </div>
                <Switch
                  id="due-date-reminders"
                  checked={preferences.notifications.dueDateReminders}
                  onCheckedChange={(value) => updateNotificationPreference("dueDateReminders", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment-notifications">Thông báo bình luận</Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo khi có người bình luận
                  </p>
                </div>
                <Switch
                  id="comment-notifications"
                  checked={preferences.notifications.comments}
                  onCheckedChange={(value) => updateNotificationPreference("comments", value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Giao diện
              </CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện ứng dụng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Chế độ hiển thị</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="w-full"
                  >
                    Sáng
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="w-full"
                  >
                    Tối
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="w-full"
                  >
                    Hệ thống
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Ngôn ngữ
              </CardTitle>
              <CardDescription>
                Chọn ngôn ngữ hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ</Label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => updateLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Kiểu card ở danh sách board */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Danh sách board
              </CardTitle>
              <CardDescription>
                Chọn cách hiển thị card board. Lưu trên máy này.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                role="radiogroup"
                aria-label="Kiểu card board"
                className="grid gap-3 sm:grid-cols-2"
              >
                {BOARD_CARD_STYLES.map((opt) => {
                  const active = boardCardStyle === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setBoardCardStyle(opt.value)}
                      className={cn(
                        "rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "border-primary bg-accent/50" : "hover:bg-accent/30",
                      )}
                    >
                      {opt.preview}
                      <p className="mt-3 text-sm font-medium">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{opt.hint}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Bảo mật
              </CardTitle>
              <CardDescription>
                Quản lý tài khoản và bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Xác thực</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bạn đăng nhập bằng Google. Mật khẩu và xác thực hai lớp được quản lý
                    trong tài khoản Google của bạn.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">
                      Mở cài đặt bảo mật Google
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Phiên đăng nhập</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Đăng xuất khỏi tất cả các thiết bị và phiên đăng nhập
                  </p>
                  <Button variant="outline" onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2 text-destructive">Vùng nguy hiểm</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Xóa tài khoản của bạn và tất cả dữ liệu liên quan. 
                    Hành động này không thể hoàn tác.
                  </p>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa tài khoản
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      <ConfirmDialog />
    </div>
  );
}
