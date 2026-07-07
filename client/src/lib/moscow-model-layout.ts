/** Seeded layout for cameras and demo IoT on the Moscow State University GLB model. */

export type IoTDeviceType =
  | "access"
  | "motion"
  | "fire"
  | "temperature"
  | "gateway"
  | "occupancy"
  | "leak"
  | "environment";

export interface ModelPosition {
  name: string;
  x: number;
  y: number;
  z: number;
  angle: number;
  location: string;
  kind: "camera" | "iot";
  iotType?: IoTDeviceType;
}

export interface DemoIoTSpec {
  id: string;
  name: string;
  type: IoTDeviceType;
  label: string;
}

/** Horizontal footprint on the model — Y is resolved via surface raycast in 3D. */
const BOUNDS = {
  xMin: -52,
  xMax: 52,
  zMin: -52,
  zMax: 52,
};

const LOCATION_PREFIXES = [
  "Main Facade",
  "Central Tower",
  "West Wing",
  "East Wing",
  "North Plaza",
  "South Courtyard",
  "Library",
  "Auditorium",
  "Laboratory",
  "Roof Terrace",
  "Perimeter",
  "Parking",
];

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

export function randomModelPosition(
  id: string,
  displayName: string,
  kind: "camera" | "iot",
  iotType?: IoTDeviceType,
): ModelPosition {
  const rand = seededRandom(id);
  const x = lerp(BOUNDS.xMin, BOUNDS.xMax, rand());
  const z = lerp(BOUNDS.zMin, BOUNDS.zMax, rand());
  const y = 0; // snapped onto model surface in 3D view
  const angle = rand() * Math.PI * 2;
  const prefix = LOCATION_PREFIXES[Math.floor(rand() * LOCATION_PREFIXES.length)];

  return {
    name: id,
    x,
    y,
    z,
    angle,
    location: kind === "iot" ? `${prefix} · ${displayName}` : `${prefix} · ${displayName}`,
    kind,
    iotType,
  };
}

export const DEMO_IOT_SPECS: DemoIoTSpec[] = [
  { id: "iot-msu-access-north", name: "North Gate Badge Reader", type: "access", label: "North Gate Access" },
  { id: "iot-msu-access-south", name: "South Gate Badge Reader", type: "access", label: "South Gate Access" },
  { id: "iot-msu-access-main", name: "Main Entrance Turnstile", type: "access", label: "Main Entrance" },
  { id: "iot-msu-motion-lobby", name: "Central Hall Motion", type: "motion", label: "Central Hall PIR" },
  { id: "iot-msu-motion-library", name: "Library Motion", type: "motion", label: "Library PIR" },
  { id: "iot-msu-fire-west", name: "West Wing Smoke", type: "fire", label: "West Wing Smoke" },
  { id: "iot-msu-fire-east", name: "East Wing Smoke", type: "fire", label: "East Wing Smoke" },
  { id: "iot-msu-temp-server", name: "Server Room Temp", type: "temperature", label: "Server Room" },
  { id: "iot-msu-gateway-plaza", name: "Plaza IoT Gateway", type: "gateway", label: "Plaza Gateway" },
  { id: "iot-msu-occupancy-aud", name: "Auditorium Occupancy", type: "occupancy", label: "Auditorium Count" },
  { id: "iot-msu-water-basement", name: "Basement Leak Sensor", type: "leak", label: "Basement Leak" },
  { id: "iot-msu-co2-lab", name: "Lab CO₂ Monitor", type: "environment", label: "Lab Air Quality" },
];

export function buildDemoIoTPositions(): ModelPosition[] {
  return DEMO_IOT_SPECS.map((spec) =>
    randomModelPosition(spec.id, spec.label, "iot", spec.type),
  );
}

export function buildCameraPositions(cameraNames: string[]): ModelPosition[] {
  return cameraNames.map((name) => randomModelPosition(name, name, "camera"));
}

export function inferIotType(name: string, model = ""): IoTDeviceType {
  const n = `${name} ${model}`.toLowerCase();
  if (n.includes("access") || n.includes("reader") || n.includes("door") || n.includes("turnstile")) {
    return "access";
  }
  if (n.includes("motion") || n.includes("pir")) return "motion";
  if (n.includes("smoke") || n.includes("fire")) return "fire";
  if (n.includes("temp") || n.includes("thermal")) return "temperature";
  if (n.includes("leak") || n.includes("water")) return "leak";
  if (n.includes("co2") || n.includes("air")) return "environment";
  if (n.includes("occupancy") || n.includes("people")) return "occupancy";
  return "gateway";
}

export function iotColor(type: IoTDeviceType): string {
  switch (type) {
    case "access":
      return "#22c55e";
    case "motion":
      return "#eab308";
    case "fire":
      return "#ef4444";
    case "temperature":
      return "#f97316";
    case "gateway":
      return "#3b82f6";
    case "occupancy":
      return "#a855f7";
    case "leak":
      return "#06b6d4";
    case "environment":
      return "#14b8a6";
  }
}

export function iotEmoji(type: IoTDeviceType): string {
  switch (type) {
    case "access":
      return "🔒";
    case "motion":
      return "👁";
    case "fire":
      return "🔥";
    case "temperature":
      return "🌡";
    case "gateway":
      return "📶";
    case "occupancy":
      return "👥";
    case "leak":
      return "💧";
    case "environment":
      return "🌿";
  }
}

export function isAccessIoT(pos: ModelPosition): boolean {
  return pos.kind === "iot" && pos.iotType === "access";
}

export function isSensorIoT(pos: ModelPosition): boolean {
  return (
    pos.kind === "iot" &&
    pos.iotType !== undefined &&
    pos.iotType !== "access" &&
    pos.iotType !== "occupancy"
  );
}

export function isOccupancyIoT(pos: ModelPosition): boolean {
  return pos.kind === "iot" && pos.iotType === "occupancy";
}
