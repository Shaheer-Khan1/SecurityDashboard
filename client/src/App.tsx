import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Dashboard from "@/pages/dashboard";
import CamerasPage from "@/pages/cameras";
import AnalyticsPage from "@/pages/analytics";
import EventsPage from "@/pages/events";
import AuditPage from "@/pages/audit";
import BookmarksPage from "@/pages/bookmarks";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import ShoppingMallPage from "@/pages/shopping-mall";
import HighSchoolPage from "@/pages/high-school";
import MoscowUniversityPage from "@/pages/moscow-university";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cameras" component={CamerasPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/audit" component={AuditPage} />
      <Route path="/bookmarks" component={BookmarksPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/shopping-mall" component={ShoppingMallPage} />
      <Route path="/high-school" component={HighSchoolPage} />
      <Route path="/moscow-university" component={MoscowUniversityPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between gap-4 h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <span className="text-sm font-medium text-muted-foreground hidden md:block">
                      Security Monitoring System
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                          <Bell className="h-5 w-5" />
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                            3
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <div className="px-4 py-2 border-b">
                          <p className="font-medium text-sm">Notifications</p>
                        </div>
                        <div className="py-2">
                          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                            <p className="text-sm font-medium">Motion detected - Camera 3</p>
                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                            <p className="text-sm font-medium">Intrusion alert - Zone A</p>
                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                            <p className="text-sm font-medium">Camera 7 offline</p>
                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="justify-center text-primary">
                          View all notifications
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ThemeToggle />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid="button-user-menu">
                          <User className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="px-4 py-2">
                          <p className="font-medium text-sm">Admin User</p>
                          <p className="text-xs text-muted-foreground">admin@security.local</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                        <DropdownMenuItem>Account</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-muted/30">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
