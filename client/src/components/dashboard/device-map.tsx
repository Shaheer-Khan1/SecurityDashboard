import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Camera } from "@shared/schema";

// Fix default marker icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_COLORS: Record<string, string> = {
  online: "#22c55e",
  recording: "#3b82f6",
  offline: "#ef4444",
  error: "#f97316",
};

function makeIcon(status: string, active: boolean) {
  const color = active ? (STATUS_COLORS[status] ?? STATUS_COLORS.online) : STATUS_COLORS.offline;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">
      <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 23 9 23s9-16.25 9-23c0-4.97-4.03-9-9-9z"
            fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="4" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
  });
}

/** Spread cameras that have no GPS coords around a demo centre point. */
function assignDemoCoords(cameras: Camera[]): (Camera & { _lat: number; _lng: number })[] {
  const centre = { lat: 51.505, lng: -0.09 };
  let demoIndex = 0;
  return cameras.map((cam) => {
    if (cam.latitude != null && cam.longitude != null) {
      return { ...cam, _lat: cam.latitude, _lng: cam.longitude };
    }
    const angle = (demoIndex / Math.max(cameras.length, 1)) * 2 * Math.PI;
    const radius = 0.018 + (demoIndex % 3) * 0.008;
    demoIndex++;
    return {
      ...cam,
      _lat: centre.lat + radius * Math.sin(angle),
      _lng: centre.lng + radius * Math.cos(angle),
    };
  });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && positions.length > 0) {
      fitted.current = true;
      if (positions.length === 1) {
        map.setView(positions[0], 14);
      } else {
        map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
      }
    }
  }, [map, positions]);
  return null;
}

interface DeviceMapProps {
  cameras: Camera[];
}

export function DeviceMap({ cameras }: DeviceMapProps) {
  const mapped = useMemo(() => assignDemoCoords(cameras), [cameras]);
  const positions = useMemo(
    () => mapped.map((c) => [c._lat, c._lng] as [number, number]),
    [mapped],
  );

  const hasReal = cameras.some((c) => c.latitude != null && c.longitude != null);

  return (
    <div className="relative w-full rounded-md overflow-hidden" style={{ height: 340 }}>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />

        {mapped.map((cam, i) => (
          <Marker
            key={`${cam.name}-${i}`}
            position={[cam._lat, cam._lng]}
            icon={makeIcon(cam.status ?? "online", cam.active)}
          >
            <Popup>
              <div className="text-xs space-y-1 min-w-[140px]">
                <p className="font-semibold text-sm">{cam.name}</p>
                {cam.model && <p className="text-muted-foreground">{cam.model}</p>}
                {cam.group && <p>Group: {cam.group}</p>}
                <p>
                  Status:{" "}
                  <span style={{ color: STATUS_COLORS[cam.status ?? "online"] }}>
                    {cam.status ?? (cam.active ? "online" : "offline")}
                  </span>
                </p>
                {cam.connectionAddress && (
                  <p className="text-muted-foreground break-all">
                    {cam.connectionAddress}
                    {cam.connectionPort ? `:${cam.connectionPort}` : ""}
                  </p>
                )}
                {cam.latitude == null && (
                  <p className="text-muted-foreground italic">demo position</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm border rounded-md px-3 py-2 text-xs space-y-1 shadow">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />
            <span className="capitalize">{s}</span>
          </div>
        ))}
      </div>

      {!hasReal && cameras.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-500/90 text-yellow-950 text-xs font-medium rounded-full px-3 py-1 shadow">
          Demo positions — no GPS data from Digifort
        </div>
      )}

      {cameras.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/60 backdrop-blur-sm text-muted-foreground text-sm">
          No cameras found
        </div>
      )}
    </div>
  );
}
