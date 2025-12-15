import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CameraGrid } from "@/components/cameras/camera-grid";
import { SearchInput } from "@/components/search-input";
import { Grid3X3, List, RefreshCcw, Camera } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Camera as CameraType, CameraGroup } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CamerasPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: cameras = [], isLoading: camerasLoading, refetch } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const { data: groups = [] } = useQuery<CameraGroup[]>({
    queryKey: ["/api/cameras/groups"],
  });

  const activateMutation = useMutation({
    mutationFn: async ({ name, activate }: { name: string; activate: boolean }) => {
      return apiRequest("POST", `/api/cameras/${name}/activation`, { action: activate ? "activate" : "deactivate" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] });
      toast({
        title: "Camera updated",
        description: "Camera status has been changed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update camera status.",
        variant: "destructive",
      });
    },
  });

  const filteredCameras = cameras.filter((camera) => {
    // Safely handle undefined/null camera.name
    const cameraName = camera?.name || "";
    const cameraGroup = camera?.group || "";
    
    const matchesSearch = cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cameraGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === "all" || cameraGroup === selectedGroup;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "online" && camera?.active) ||
      (statusFilter === "offline" && !camera?.active) ||
      (statusFilter === "recording" && camera?.status === "recording");
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const stats = {
    total: cameras.length,
    online: cameras.filter((c) => c.active).length,
    recording: cameras.filter((c) => c.status === "recording").length,
    offline: cameras.filter((c) => !c.active).length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Cameras</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor your security cameras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh-cameras"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Badge variant="outline" className="text-xs">
          <Camera className="h-3 w-3 mr-1" />
          {stats.total} Total
        </Badge>
        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5" />
          {stats.online} Online
        </Badge>
        <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />
          {stats.recording} Recording
        </Badge>
        <Badge variant="outline" className="text-xs text-gray-600 dark:text-gray-400">
          <span className="h-2 w-2 rounded-full bg-gray-500 mr-1.5" />
          {stats.offline} Offline
        </Badge>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          placeholder="Search cameras..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-64"
        />
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-40" data-testid="select-camera-group">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.name} value={group.name}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32" data-testid="select-camera-status">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="recording">Recording</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CameraGrid
        cameras={filteredCameras}
        isLoading={camerasLoading}
        onActivate={(name, activate) => activateMutation.mutate({ name, activate })}
        onViewFullscreen={(name) => {
          toast({
            title: "Fullscreen",
            description: `Opening ${name} in fullscreen mode...`,
          });
        }}
      />
    </div>
  );
}
