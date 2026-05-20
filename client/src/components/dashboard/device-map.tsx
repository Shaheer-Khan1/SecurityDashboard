import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Camera } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

type DeviceType = "CAMERA" | "IOT_DEVICE";
type DeviceStatus = "online" | "offline" | "warning";

interface DevicePoint {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  latitude: number;
  longitude: number;
  source: "demo" | "digifort";
}

const DEMO_IOT_DEVICES: DevicePoint[] = [
  {
    id: "IOT-101",
    name: "Main Gate Access Panel",
    type: "IOT_DEVICE",
    status: "online",
    latitude: 25.2054,
    longitude: 55.2719,
    source: "demo",
  },
  {
    id: "IOT-102",
    name: "Warehouse Door Sensor",
    type: "IOT_DEVICE",
    status: "online",
    latitude: 25.1981,
    longitude: 55.2782,
    source: "demo",
  },
  {
    id: "IOT-103",
    name: "Parking LPR Unit",
    type: "IOT_DEVICE",
    status: "warning",
    latitude: 25.2109,
    longitude: 55.2645,
    source: "demo",
  },
  {
    id: "IOT-104",
    name: "Lobby Fire Panel",
    type: "IOT_DEVICE",
    status: "offline",
    latitude: 25.2023,
    longitude: 55.2863,
    source: "demo",
  },
];

function isValidCoordinate(lat?: number, lng?: number): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function statusColor(status: DeviceStatus): string {
  if (status === "online") return "#22c55e";
  if (status === "warning") return "#f59e0b";
  return "#ef4444";
}

export function DeviceMap({ cameras }: { cameras: Camera[] }) {
  const cameraPoints = useMemo<DevicePoint[]>(
    () =>
      cameras
        .filter((camera) => isValidCoordinate(camera.latitude, camera.longitude))
        .slice(0, 100)
        .map((camera, idx) => ({
          id: `CAM-${idx}-${camera.name}`,
          name: camera.name,
          type: "CAMERA",
          status: camera.working === false ? "offline" : "online",
          latitude: camera.latitude as number,
          longitude: camera.longitude as number,
          source: "digifort",
        })),
    [cameras]
  );

  const points = useMemo(() => [...DEMO_IOT_DEVICES, ...cameraPoints], [cameraPoints]);

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [25.2048, 55.2708];
    const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    return [avgLat, avgLng];
  }, [points]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[11px]">Demo IoT: {DEMO_IOT_DEVICES.length}</Badge>
        <Badge variant="outline" className="text-[11px]">Cameras with coordinates: {cameraPoints.length}</Badge>
        <Badge variant="outline" className="text-[11px]">Total mapped: {points.length}</Badge>
      </div>

      <div className="h-[380px] w-full overflow-hidden rounded-md border">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {points.map((point) => (
            <CircleMarker
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={point.type === "CAMERA" ? 8 : 10}
              pathOptions={{
                color: statusColor(point.status),
                fillColor: statusColor(point.status),
                fillOpacity: 0.7,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">{point.name}</p>
                  <p><strong>ID:</strong> {point.id}</p>
                  <p><strong>Type:</strong> {point.type}</p>
                  <p><strong>Status:</strong> {point.status}</p>
                  <p><strong>Source:</strong> {point.source}</p>
                  <p>
                    <strong>Coordinates:</strong> {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
