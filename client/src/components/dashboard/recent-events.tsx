import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ChevronRight, AlertTriangle, Camera, Shield, Users } from "lucide-react";
import type { AnalyticsEvent } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RecentEventsProps {
  events: AnalyticsEvent[];
  isLoading?: boolean;
}

const eventIcons: Record<string, typeof Bell> = {
  MOTION: Camera,
  INTRUSION: AlertTriangle,
  FACE_DETECTION: Users,
  TAMPERING: Shield,
};

const eventSeverity: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  MOTION: "secondary",
  INTRUSION: "destructive",
  FACE_DETECTION: "default",
  TAMPERING: "destructive",
  ENTER: "secondary",
  EXIT: "secondary",
  LOITERING: "default",
  FIRE: "destructive",
  SMOKE: "destructive",
};

export function RecentEvents({ events, isLoading }: RecentEventsProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Events
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <a href="/events" data-testid="link-view-all-events">
              View all
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[320px] px-6">
          <div className="space-y-2 pb-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent events</p>
              </div>
            ) : (
              events.map((event) => {
                const Icon = eventIcons[event.eventType] || Bell;
                const severity = eventSeverity[event.eventType] || "secondary";
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-md hover-elevate active-elevate-2 cursor-pointer border border-transparent hover:border-border transition-colors"
                    data-testid={`event-item-${event.id}`}
                  >
                    <div className={`p-2 rounded-full ${
                      severity === "destructive" 
                        ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{event.camera}</span>
                        <Badge variant={severity} className="text-xs">
                          {event.eventType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.zone && `Zone: ${event.zone} • `}
                        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
