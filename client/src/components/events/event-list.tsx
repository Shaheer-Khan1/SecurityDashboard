import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Camera, Clock, MapPin, AlertTriangle } from "lucide-react";
import type { AnalyticsEvent } from "@shared/schema";
import { format } from "date-fns";

interface EventListProps {
  events: AnalyticsEvent[];
  isLoading?: boolean;
  title?: string;
}

const severityMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  MOTION: "secondary",
  INTRUSION: "destructive",
  FACE_DETECTION: "default",
  VEHICLE_DETECTION: "secondary",
  TAMPERING: "destructive",
  LOITERING: "default",
  LINE_CROSSING: "secondary",
  FIRE: "destructive",
  SMOKE: "destructive",
  ENTER: "secondary",
  EXIT: "secondary",
};

export function EventList({ events, isLoading, title = "Security Events" }: EventListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 border rounded-md animate-pulse">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {title}
          </div>
          <Badge variant="outline" className="text-xs">
            {events.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="p-4 pt-0 space-y-2">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-medium mb-1">No events found</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust your filters or check back later.
                </p>
              </div>
            ) : (
              events.map((event) => {
                const severity = severityMap[event.eventType] || "secondary";
                const isCritical = severity === "destructive";

                return (
                  <div
                    key={event.id}
                    className={`p-4 rounded-md border transition-colors hover-elevate active-elevate-2 cursor-pointer ${
                      isCritical ? "border-red-500/30 bg-red-500/5" : ""
                    }`}
                    data-testid={`event-list-item-${event.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full shrink-0 ${
                        isCritical 
                          ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isCritical ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          <Bell className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant={severity} className="text-xs">
                            {event.eventType.replace(/_/g, " ")}
                          </Badge>
                          {event.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(event.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {event.camera}
                          </span>
                          {event.zone && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.zone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-mono text-xs">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.timestamp), "MMM dd, HH:mm:ss")}
                          </span>
                        </div>
                        {event.ruleName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Rule: {event.ruleName}
                          </p>
                        )}
                      </div>
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
