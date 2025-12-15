import { useLocation } from "wouter";
import {
  Camera,
  LayoutDashboard,
  Activity,
  FileText,
  Bookmark,
  Settings,
  Bell,
  ShoppingBag,
  Shield,
  GraduationCap,
  Building,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Cameras",
    url: "/cameras",
    icon: Camera,
    badge: "46",
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: Activity,
  },
  {
    title: "Shopping Mall",
    url: "/shopping-mall",
    icon: ShoppingBag,
    badge: "LIVE",
  },
  {
    title: "High School",
    url: "/high-school",
    icon: GraduationCap,
    badge: "NEW",
  },
  {
    title: "Moscow University",
    url: "/moscow-university",
    icon: Building,
    badge: "NEW",
  },
  {
    title: "Events",
    url: "/events",
    icon: Bell,
    badge: "3",
  },
];

const managementItems = [
  {
    title: "Audit Logs",
    url: "/audit",
    icon: FileText,
  },
  {
    title: "Bookmarks",
    url: "/bookmarks",
    icon: Bookmark,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Security</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <a href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <a href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 rounded-md bg-muted p-3">
          <div className="h-2 w-2 rounded-full bg-status-online animate-pulse" />
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
