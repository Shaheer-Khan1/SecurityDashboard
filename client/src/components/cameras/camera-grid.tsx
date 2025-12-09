import { CameraCard } from "./camera-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera } from "lucide-react";
import type { Camera as CameraType } from "@shared/schema";

interface CameraGridProps {
  cameras: CameraType[];
  isLoading?: boolean;
  onActivate?: (name: string, activate: boolean) => void;
  onViewFullscreen?: (name: string) => void;
}

export function CameraGrid({ cameras, isLoading, onActivate, onViewFullscreen }: CameraGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden border">
            <Skeleton className="aspect-video" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Camera className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No cameras found</h3>
        <p className="text-muted-foreground text-sm">
          Connect cameras to start monitoring your security feeds.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cameras.map((camera) => (
        <CameraCard
          key={camera.name}
          camera={camera}
          onActivate={onActivate}
          onViewFullscreen={onViewFullscreen}
        />
      ))}
    </div>
  );
}
