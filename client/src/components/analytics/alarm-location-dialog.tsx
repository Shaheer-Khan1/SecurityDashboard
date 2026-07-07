import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Camera } from "@shared/schema";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const REGION_CENTERS: Record<string, [number, number]> = {
  "Central Region": [24.7136, 46.6753],
  "Eastern Region": [26.3927, 49.9777],
  "Western Region": [21.4858, 39.1925],
  "Southern Region": [18.2164, 42.5053],
  "Northern Region": [28.3838, 36.555],
};

function alarmIcon(isActive: boolean) {
  const color = isActive ? "#ef4444" : "#6b7280";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23c0-4.97-4.03-9-9-9z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="9" r="4" fill="white"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
  });
}

function MapResizer({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
      map.setView([lat, lng], 15);
    }, 150);
    return () => clearTimeout(t);
  }, [map, lat, lng]);
  return null;
}

export interface AlarmForMap {
  id: string;
  camera: string;
  eventType: string;
  alarmStatus: string;
  region: string;
  site: string;
  severity?: string;
  description?: string;
  timestamp: string;
  zone?: string;
}

export function resolveAlarmCoordinates(
  alarm: AlarmForMap,
  cameras: Camera[],
): { lat: number; lng: number; source: "camera" | "region" } {
  const cam = cameras.find((c) => c.name === alarm.camera);
  if (cam?.latitude != null && cam?.longitude != null) {
    return { lat: Number(cam.latitude), lng: Number(cam.longitude), source: "camera" };
  }
  const center = REGION_CENTERS[alarm.region] ?? [24.7136, 46.6753];
  return { lat: center[0], lng: center[1], source: "region" };
}

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

interface AlarmLocationDialogProps {
  alarm: AlarmForMap | null;
  cameras: Camera[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlarmLocationDialog({
  alarm,
  cameras,
  open,
  onOpenChange,
}: AlarmLocationDialogProps) {
  if (!alarm) return null;

  const { lat, lng, source } = resolveAlarmCoordinates(alarm, cameras);
  const isActive = alarm.alarmStatus === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {alarm.eventType.replace(/_/g, " ")}
            <Badge variant={isActive ? "destructive" : "secondary"} className="capitalize text-xs">
              {isActive ? "Active" : "Closed"}
            </Badge>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-left text-sm">
              <p><span className="text-muted-foreground">Camera:</span> {alarm.camera}</p>
              <p><span className="text-muted-foreground">Site:</span> {alarm.site}</p>
              <p><span className="text-muted-foreground">Region:</span> {alarm.region}</p>
              {alarm.zone && <p><span className="text-muted-foreground">Zone:</span> {alarm.zone}</p>}
              {alarm.description && (
                <p className="text-muted-foreground text-xs mt-1">{alarm.description}</p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full rounded-md overflow-hidden border" style={{ height: 280 }}>
          <MapContainer
            center={[lat, lng]}
            zoom={15}
            style={{ width: "100%", height: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResizer lat={lat} lng={lng} />
            <Marker position={[lat, lng]} icon={alarmIcon(isActive)} />
          </MapContainer>
          {source === "region" && (
            <div className="absolute top-2 left-2 z-[1000] bg-yellow-500/90 text-yellow-950 text-xs font-medium rounded px-2 py-1">
              Approx. region centre
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
          <Button asChild size="sm">
            <a
              href={googleMapsUrl(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Google Maps
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
