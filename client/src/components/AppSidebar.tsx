import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  GraduationCap,
  ListTodo,
  Grid3X3,
  NotebookText,
  BrainCircuit,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Planner", url: "/planner", icon: Calendar },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Editor", url: "/editor", icon: FileText },
  { title: "References", url: "/references", icon: BookOpen },
  { title: "Matrix", url: "/matrix", icon: Grid3X3 },
  { title: "Journal", url: "/journal", icon: NotebookText },
  { title: "Defense Prep", url: "/defense", icon: BrainCircuit },
  { title: "Methodology", url: "/methodology", icon: Wand2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { title: t.navDashboard, url: "/dashboard", icon: LayoutDashboard },
    { title: t.navPlanner, url: "/planner", icon: Calendar },
    { title: t.navTasks, url: "/tasks", icon: ListTodo },
    { title: t.navEditor, url: "/editor", icon: FileText },
    { title: t.navReferences, url: "/references", icon: BookOpen },
    { title: t.navMatrix, url: "/matrix", icon: Grid3X3 },
    { title: t.navJournal, url: "/journal", icon: NotebookText },
    { title: t.navDefensePrep, url: "/defense", icon: BrainCircuit },
    { title: t.navMethodology, url: "/methodology", icon: Wand2 },
    { title: t.navSettings, url: "/settings", icon: Settings },
  ];


  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold">Thesard by Amal Mouaki</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{t.progress}</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="p-3 rounded-lg bg-sidebar-accent/50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-sidebar-foreground">{t.overall}</span>
                <span className="text-muted-foreground">0%</span>
              </div>
              <Progress value={0} className="h-1.5" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
            <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.studyLevel === "phd" ? "PhD Student" : user?.studyLevel === "masters" ? "Master's Student" : "Student"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-logout"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar >
  );
}
