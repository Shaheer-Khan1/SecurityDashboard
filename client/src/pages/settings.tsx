import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Settings, 
  Server, 
  Bell, 
  Shield, 
  Database, 
  RefreshCcw,
  Save,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  const handleTestConnection = () => {
    toast({
      title: "Testing connection",
      description: "Connecting to Digifort server...",
    });
    setTimeout(() => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to the Digifort server.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your security dashboard preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" data-testid="tab-settings-general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="server" data-testid="tab-settings-server">
            <Server className="h-4 w-4 mr-2" />
            Server
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-settings-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-settings-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the dashboard looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more cameras in the grid view
                  </p>
                </div>
                <Switch data-testid="switch-compact-view" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-refresh</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh camera feeds and events
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-auto-refresh" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>
                Configure dashboard display options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Refresh Interval (seconds)</Label>
                  <Input 
                    type="number" 
                    defaultValue="30" 
                    min="5" 
                    max="300" 
                    data-testid="input-refresh-interval"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Events Display</Label>
                  <Input 
                    type="number" 
                    defaultValue="100" 
                    min="10" 
                    max="500" 
                    data-testid="input-max-events"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="server" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Digifort Server</CardTitle>
                  <CardDescription>
                    Configure connection to your Digifort VMS
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Server Address</Label>
                  <Input 
                    placeholder="192.168.1.100" 
                    defaultValue="localhost"
                    data-testid="input-server-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input 
                    type="number" 
                    placeholder="8080" 
                    defaultValue="8089"
                    data-testid="input-server-port"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    placeholder="admin" 
                    data-testid="input-server-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    data-testid="input-server-password"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" onClick={handleTestConnection} data-testid="button-test-connection">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button onClick={handleSave} data-testid="button-save-server">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Mock Server
              </CardTitle>
              <CardDescription>
                Python mock server for development and testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-0.5">
                  <p className="font-medium">Mock Server Status</p>
                  <p className="text-sm text-muted-foreground">
                    Simulates Digifort API responses for development
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 dark:text-green-400">
                  Running on port 8089
                </Badge>
              </div>
              <Button variant="outline" asChild>
                <a href="http://localhost:8089/docs" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View API Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Notifications</CardTitle>
              <CardDescription>
                Configure how you receive security alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for security events
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-enable-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Play audio for critical events
                  </p>
                </div>
                <Switch data-testid="switch-sound-alerts" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show browser notifications
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-desktop-notifications" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>
                Choose which events trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Motion Detection", enabled: true },
                { name: "Intrusion Detection", enabled: true },
                { name: "Face Recognition", enabled: true },
                { name: "Vehicle Detection", enabled: false },
                { name: "Tampering", enabled: true },
                { name: "Fire/Smoke Detection", enabled: true },
              ].map((event) => (
                <div key={event.name} className="flex items-center justify-between">
                  <Label>{event.name}</Label>
                  <Switch defaultChecked={event.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>
                Manage security and access settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Switch data-testid="switch-2fa" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically logout after inactivity
                  </p>
                </div>
                <Switch defaultChecked data-testid="switch-session-timeout" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Session Timeout Duration (minutes)</Label>
                <Input 
                  type="number" 
                  defaultValue="30" 
                  min="5" 
                  max="480" 
                  className="w-32"
                  data-testid="input-session-timeout"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>
                Manage API authentication tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="space-y-0.5">
                  <p className="font-medium">API Token</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    ••••••••••••••••
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
