import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Camera,
  Circle,
  Maximize2,
  MoreVertical,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Settings,
  Power,
} from "lucide-react";
import type { Camera as CameraType } from "@shared/schema";

interface CameraCardProps {
  camera: CameraType;
  onActivate?: (name: string, activate: boolean) => void;
  onViewFullscreen?: (name: string) => void;
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-500",
  recording: "bg-red-500",
  error: "bg-amber-500",
};

const statusLabels = {
  online: "Online",
  offline: "Offline",
  recording: "Recording",
  error: "Error",
};

export function CameraCard({ camera, onActivate, onViewFullscreen }: CameraCardProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const status = camera.status || (camera.active ? "online" : "offline");
  const isRecording = status === "recording";

  return (
    <Card
      className="overflow-hidden group min-w-[220px]"
      data-testid={`camera-card-${camera.name}`}
    >
      <div className="relative aspect-video bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Camera className="h-12 w-12 text-muted-foreground/30" />
        </div>
        
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
            <span className={`h-2 w-2 rounded-full mr-1.5 ${statusColors[status]} ${isRecording ? 'animate-pulse' : ''}`} />
            {statusLabels[status]}
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 backdrop-blur-sm bg-background/80"
                data-testid={`button-camera-menu-${camera.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewFullscreen?.(camera.name)}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download Snapshot
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onActivate?.(camera.name, !camera.active)}
                className={camera.active ? "text-destructive" : ""}
              >
                <Power className="h-4 w-4 mr-2" />
                {camera.active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsPaused(!isPaused)}
              data-testid={`button-camera-play-${camera.name}`}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
              data-testid={`button-camera-mute-${camera.name}`}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => onViewFullscreen?.(camera.name)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isRecording && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <Circle className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" />
            <span className="text-xs text-white font-medium">REC</span>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate" data-testid={`text-camera-name-${camera.name}`}>
              {camera.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {camera.group || "No group"} {camera.model && `• ${camera.model}`}
            </p>
          </div>
          {camera.recordingHours !== undefined && (
            <Badge variant="outline" className="text-xs shrink-0">
              {camera.recordingHours}h
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
