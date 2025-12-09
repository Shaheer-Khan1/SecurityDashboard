import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EventFilters } from "@/components/events/event-filters";
import { EventList } from "@/components/events/event-list";
import { RefreshCcw, Download } from "lucide-react";
import type { AnalyticsEvent, AnalyticsSearchParams, Camera } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const [filters, setFilters] = useState<Partial<AnalyticsSearchParams>>({});
  const { toast } = useToast();

  const { data: events = [], isLoading: eventsLoading, refetch } = useQuery<AnalyticsEvent[]>({
    queryKey: ["/api/analytics/events", filters],
  });

  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  });

  const handleFilterChange = (newFilters: Partial<AnalyticsSearchParams>) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your event data is being prepared for download.",
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Security Events</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search and monitor security events across all cameras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} data-testid="button-export-events">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-events">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <EventFilters
        onFilterChange={handleFilterChange}
        cameras={cameras.map((c) => c.name)}
      />

      <EventList events={events} isLoading={eventsLoading} />
    </div>
  );
}
