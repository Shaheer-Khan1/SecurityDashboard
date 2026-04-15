import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Activity,
  Clock,
  Server,
  Tag,
  Hash,
  Search,
  Trash2,
  Download,
  Play,
  Pause,
  RefreshCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Code2,
  Info,
  ChevronRight,
  ShieldCheck,
  ShieldX,
  Flame,
  Eye,
  Car,
  PersonStanding,
  DoorOpen,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MetadataValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<string | number | boolean | Record<string, unknown>>;

interface SmartConnectEvent {
  eventId: string;
  eventCode?: string;
  eventName: string;
  sourceId: string;
  sourceType?: string;
  sourceName: string;
  timestamp: string;
  metadata?: Record<string, MetadataValue>;
  _receivedAt?: number;
  _valid?: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EVENT_TEMPLATES = [
  {
    name: "Access Granted",
    code: "1000",
    sourceType: "ACCESS_CONTROLLER",
    severity: "info",
  },
  {
    name: "Access Denied",
    code: "1001",
    sourceType: "ACCESS_CONTROLLER",
    severity: "warning",
  },
  {
    name: "Door Forced Open",
    code: "1010",
    sourceType: "ACCESS_CONTROLLER",
    severity: "critical",
  },
  {
    name: "Motion Detected",
    code: "2001",
    sourceType: "CAMERA",
    severity: "info",
  },
  {
    name: "Person Detected",
    code: "2002",
    sourceType: "CAMERA",
    severity: "info",
  },
  {
    name: "Vehicle Detected",
    code: "2003",
    sourceType: "CAMERA",
    severity: "info",
  },
  {
    name: "Intrusion Alert",
    code: "3001",
    sourceType: "SENSOR",
    severity: "critical",
  },
  {
    name: "Zone Breach",
    code: "3002",
    sourceType: "SENSOR",
    severity: "warning",
  },
  {
    name: "Fire Alarm",
    code: "4001",
    sourceType: "FIRE_PANEL",
    severity: "critical",
  },
  {
    name: "Smoke Detected",
    code: "4002",
    sourceType: "FIRE_PANEL",
    severity: "warning",
  },
];

const MOCK_SOURCES = [
  {
    id: "CTRL-001",
    name: "Main Entrance Controller",
    type: "ACCESS_CONTROLLER",
  },
  { id: "CTRL-005", name: "North Gate Controller", type: "ACCESS_CONTROLLER" },
  { id: "CTRL-009", name: "Parking Barrier", type: "ACCESS_CONTROLLER" },
  { id: "CAM-101", name: "Lobby Camera", type: "CAMERA" },
  { id: "CAM-202", name: "Parking Lot Camera", type: "CAMERA" },
  { id: "CAM-305", name: "Corridor B Camera", type: "CAMERA" },
  { id: "SNS-001", name: "Zone A Perimeter Sensor", type: "SENSOR" },
  { id: "SNS-004", name: "Server Room Sensor", type: "SENSOR" },
  { id: "FP-001", name: "Floor 1 Fire Panel", type: "FIRE_PANEL" },
  { id: "FP-002", name: "Basement Fire Panel", type: "FIRE_PANEL" },
];

const CARDHOLDERS = [
  "Alice Smith",
  "Bob Johnson",
  "Charlie Davis",
  "Diana Prince",
  "Eve Torres",
  "Frank Miller",
];

const DOOR_NAMES = [
  "North Entry Gate",
  "South Exit",
  "Server Room",
  "Parking Level A",
  "Executive Floor",
];

let eventCounter = 9900;

function generateMockEvent(): SmartConnectEvent {
  const tmpl =
    EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  const compatibleSources = MOCK_SOURCES.filter((s) => s.type === tmpl.sourceType);
  const source =
    compatibleSources[Math.floor(Math.random() * compatibleSources.length)] ??
    MOCK_SOURCES[0];

  eventCounter++;
  const base: SmartConnectEvent = {
    eventId: `EVT-${eventCounter}`,
    eventCode: tmpl.code,
    eventName: tmpl.name,
    sourceId: source.id,
    sourceType: source.type,
    sourceName: source.name,
    timestamp: new Date().toISOString(),
    _receivedAt: Date.now(),
    _valid: true,
  };

  if (tmpl.sourceType === "ACCESS_CONTROLLER") {
    const cardholder = CARDHOLDERS[Math.floor(Math.random() * CARDHOLDERS.length)];
    base.metadata = {
      "acs.badgeId": `B-${Math.floor(Math.random() * 90000) + 10000}`,
      "acs.cardholderId": `CH-${Math.floor(Math.random() * 900) + 100}`,
      "acs.cardholderName": cardholder,
      "acs.doorId": `DOOR-${source.id.split("-")[1]}`,
      "acs.doorName": DOOR_NAMES[Math.floor(Math.random() * DOOR_NAMES.length)],
      "acs.decision": tmpl.name.includes("Granted") ? "GRANTED" : "DENIED",
      "acs.reasonCodes": tmpl.name.includes("Granted")
        ? ["MATCHED_ACCESS_LEVEL", "VALID_TIMEZONE"]
        : ["ACCESS_LEVEL_MISMATCH", "NO_SCHEDULE"],
      panelIp: `10.0.3.${Math.floor(Math.random() * 254) + 1}`,
      panelName: source.name,
    };
  } else if (tmpl.sourceType === "CAMERA") {
    base.metadata = {
      "cam.confidence": parseFloat((Math.random() * 35 + 65).toFixed(1)),
      "cam.zone": `Zone-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
      "cam.objectClass":
        tmpl.name.includes("Vehicle") ? "VEHICLE" : "PERSON",
      "cam.trackId": `TRK-${Math.floor(Math.random() * 9999)}`,
      "cam.boundingBox": {
        x: Math.floor(Math.random() * 1280),
        y: Math.floor(Math.random() * 720),
        width: Math.floor(Math.random() * 200) + 50,
        height: Math.floor(Math.random() * 300) + 100,
      },
    };
  } else if (tmpl.sourceType === "SENSOR") {
    base.metadata = {
      "sensor.zoneId": `ZONE-${Math.floor(Math.random() * 20) + 1}`,
      "sensor.triggerValue": parseFloat((Math.random() * 100).toFixed(2)),
      "sensor.threshold": 75,
      "sensor.unit": "percent",
    };
  } else if (tmpl.sourceType === "FIRE_PANEL") {
    base.metadata = {
      "fire.detectorId": `DET-${Math.floor(Math.random() * 50) + 1}`,
      "fire.zone": `F${Math.floor(Math.random() * 5) + 1}-${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
      "fire.temperature": parseFloat((Math.random() * 40 + 30).toFixed(1)),
      "fire.smokeLevel": parseFloat((Math.random() * 80).toFixed(1)),
    };
  }

  return base;
}

function buildInitialEvents(): SmartConnectEvent[] {
  const events: SmartConnectEvent[] = [];
  for (let i = 0; i < 15; i++) {
    const e = generateMockEvent();
    // Stagger timestamps for initial load
    const msBack = (15 - i) * 4000 + Math.floor(Math.random() * 2000);
    e.timestamp = new Date(Date.now() - msBack).toISOString();
    e._receivedAt = Date.now() - msBack;
    events.push(e);
  }
  return events.reverse();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverity(event: SmartConnectEvent): "info" | "warning" | "critical" {
  const tmpl = EVENT_TEMPLATES.find((t) => t.code === event.eventCode);
  if (tmpl) return tmpl.severity as "info" | "warning" | "critical";
  const name = event.eventName.toLowerCase();
  if (
    name.includes("denied") ||
    name.includes("forced") ||
    name.includes("intrusion") ||
    name.includes("fire") ||
    name.includes("alarm") ||
    name.includes("breach")
  )
    return "critical";
  if (name.includes("warning") || name.includes("smoke") || name.includes("alert"))
    return "warning";
  return "info";
}

function formatRelativeTime(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getEventIcon(event: SmartConnectEvent) {
  const st = event.sourceType ?? "";
  const name = event.eventName.toLowerCase();
  if (name.includes("fire") || name.includes("smoke")) return Flame;
  if (name.includes("vehicle")) return Car;
  if (name.includes("intrusion") || name.includes("breach")) return AlertTriangle;
  if (name.includes("denied")) return ShieldX;
  if (name.includes("granted")) return ShieldCheck;
  if (name.includes("door")) return DoorOpen;
  if (name.includes("motion") || name.includes("person")) return PersonStanding;
  if (st === "CAMERA") return Eye;
  if (st === "SENSOR") return Activity;
  return Zap;
}

function getSourceTypeBadgeColor(type: string): string {
  switch (type) {
    case "ACCESS_CONTROLLER":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "CAMERA":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "SENSOR":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "FIRE_PANEL":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "critical":
      return {
        border: "border-l-red-500",
        dot: "bg-red-500",
        badge: "bg-red-500/15 text-red-400 border-red-500/30",
        icon: "text-red-400",
      };
    case "warning":
      return {
        border: "border-l-yellow-500",
        dot: "bg-yellow-500",
        badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
        icon: "text-yellow-400",
      };
    default:
      return {
        border: "border-l-green-500",
        dot: "bg-green-500",
        badge: "bg-green-500/15 text-green-400 border-green-500/30",
        icon: "text-green-400",
      };
  }
}

function validateEvent(obj: unknown): {
  valid: boolean;
  errors: string[];
  event: SmartConnectEvent | null;
} {
  const errors: string[] = [];
  if (typeof obj !== "object" || obj === null) {
    return { valid: false, errors: ["Input must be a JSON object"], event: null };
  }
  const o = obj as Record<string, unknown>;
  const required = ["eventId", "eventName", "sourceId", "sourceName", "timestamp"];
  for (const field of required) {
    if (!o[field]) errors.push(`Missing required field: "${field}"`);
  }
  if (o.timestamp && isNaN(new Date(o.timestamp as string).getTime())) {
    errors.push(`"timestamp" is not a valid ISO-8601 date-time`);
  }
  if (errors.length > 0) return { valid: false, errors, event: null };
  return {
    valid: true,
    errors: [],
    event: {
      ...(o as unknown as SmartConnectEvent),
      _receivedAt: Date.now(),
      _valid: true,
    },
  };
}

function renderMetadataValue(value: MetadataValue, depth = 0): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {value.map((item, idx) => (
          <Badge key={idx} variant="outline" className="text-xs font-mono">
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </Badge>
        ))}
      </div>
    );
  }
  if (typeof value === "object" && value !== null) {
    return (
      <div className={cn("mt-1 space-y-1 pl-3 border-l border-border", depth > 0 && "pl-2")}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <span className="text-muted-foreground font-mono shrink-0">{k}:</span>
            <span className="font-mono text-foreground break-all">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          value
            ? "border-green-500/30 text-green-400"
            : "border-red-500/30 text-red-400"
        )}
      >
        {value ? "true" : "false"}
      </Badge>
    );
  }
  return <span className="font-mono text-foreground break-all">{String(value)}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConnectionStatusPill({ live }: { live: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        live
          ? "border-green-500/40 bg-green-500/10 text-green-400"
          : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-green-400 animate-pulse" : "bg-yellow-400"
        )}
      />
      {live ? "Live" : "Paused"}
    </div>
  );
}

interface EventRowProps {
  event: SmartConnectEvent;
  selected: boolean;
  onClick: () => void;
  isNew?: boolean;
}

function EventRow({ event, selected, onClick, isNew }: EventRowProps) {
  const severity = getSeverity(event);
  const styles = getSeverityStyles(severity);
  const Icon = getEventIcon(event);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left group flex items-start gap-3 rounded-md border-l-2 px-3 py-2.5 transition-all",
        "hover:bg-accent/60",
        styles.border,
        selected ? "bg-accent" : "bg-transparent",
        isNew && "animate-in slide-in-from-top-1 duration-300"
      )}
    >
      <div className={cn("mt-0.5 shrink-0", styles.icon)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium leading-none">
            {event.eventName}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {event.sourceName}
          </span>
          {event.sourceType && (
            <Badge
              variant="outline"
              className={cn("text-[10px] h-4 px-1.5", getSourceTypeBadgeColor(event.sourceType))}
            >
              {event.sourceType.replace("_", " ")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
          <Hash className="h-2.5 w-2.5" />
          {event.eventId}
        </div>
      </div>
      <ChevronRight
        className={cn(
          "mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform",
          selected && "rotate-90 text-muted-foreground"
        )}
      />
    </button>
  );
}

interface EventDetailPanelProps {
  event: SmartConnectEvent | null;
  onClose: () => void;
}

function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const { toast } = useToast();
  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
        <div className="rounded-full bg-muted p-4">
          <Info className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Select an event from the feed to inspect its details
        </p>
      </div>
    );
  }

  const severity = getSeverity(event);
  const styles = getSeverityStyles(severity);
  const Icon = getEventIcon(event);

  const copyJson = () => {
    const { _receivedAt, _valid, ...clean } = event;
    navigator.clipboard.writeText(JSON.stringify(clean, null, 2));
    toast({ title: "Copied to clipboard", description: "Event JSON copied." });
  };

  const fields: Array<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = [
    {
      label: "Event ID",
      value: <span className="font-mono text-sm">{event.eventId}</span>,
      icon: <Hash className="h-3.5 w-3.5" />,
    },
    {
      label: "Event Code",
      value: event.eventCode ? (
        <span className="font-mono text-sm">{event.eventCode}</span>
      ) : (
        <span className="text-muted-foreground text-xs italic">—</span>
      ),
      icon: <Tag className="h-3.5 w-3.5" />,
    },
    {
      label: "Event Name",
      value: (
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", styles.icon)} />
          <span className="text-sm font-medium">{event.eventName}</span>
        </div>
      ),
      icon: <Zap className="h-3.5 w-3.5" />,
    },
    {
      label: "Source ID",
      value: <span className="font-mono text-sm">{event.sourceId}</span>,
      icon: <Server className="h-3.5 w-3.5" />,
    },
    {
      label: "Source Name",
      value: <span className="text-sm">{event.sourceName}</span>,
      icon: <Server className="h-3.5 w-3.5" />,
    },
    {
      label: "Source Type",
      value: event.sourceType ? (
        <Badge
          variant="outline"
          className={cn("text-xs", getSourceTypeBadgeColor(event.sourceType))}
        >
          {event.sourceType}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs italic">—</span>
      ),
      icon: <Tag className="h-3.5 w-3.5" />,
    },
    {
      label: "Timestamp",
      value: (
        <div className="space-y-0.5">
          <p className="font-mono text-sm">{event.timestamp}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(event.timestamp).toLocaleString()}
          </p>
        </div>
      ),
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    {
      label: "Severity",
      value: (
        <Badge variant="outline" className={cn("text-xs capitalize", styles.badge)}>
          {severity}
        </Badge>
      ),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-3 border-l-4 px-4 py-3", styles.border)}>
        <div className={cn("rounded-full bg-muted p-2", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{event.eventName}</p>
          <p className="text-xs text-muted-foreground truncate">{event.sourceName}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyJson}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.label} className="grid grid-cols-[100px_1fr] gap-2 items-start">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                  {f.icon}
                  {f.label}
                </div>
                <div>{f.value}</div>
              </div>
            ))}
          </div>

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Metadata
                </p>
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <div key={key} className="space-y-0.5">
                      <p className="text-[11px] font-mono text-muted-foreground">{key}</p>
                      <div className="text-xs pl-1">
                        {renderMetadataValue(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ events }: { events: SmartConnectEvent[] }) {
  const total = events.length;
  const critical = events.filter((e) => getSeverity(e) === "critical").length;
  const warning = events.filter((e) => getSeverity(e) === "warning").length;
  const info = events.filter((e) => getSeverity(e) === "info").length;

  const sourceTypes = new Set(events.map((e) => e.sourceType).filter(Boolean));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="bg-card border">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Events</p>
            <p className="text-xl font-bold tabular-nums">{total}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="rounded-md bg-red-500/10 p-2">
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Critical</p>
            <p className="text-xl font-bold tabular-nums text-red-400">{critical}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="rounded-md bg-yellow-500/10 p-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Warnings</p>
            <p className="text-xl font-bold tabular-nums text-yellow-400">{warning}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="rounded-md bg-green-500/10 p-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sources Active</p>
            <p className="text-xl font-bold tabular-nums text-green-400">
              {sourceTypes.size}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── JSON Inspector ───────────────────────────────────────────────────────────

interface JsonInspectorProps {
  onInject: (event: SmartConnectEvent) => void;
}

function JsonInspector({ onInject }: JsonInspectorProps) {
  const [raw, setRaw] = useState(
    JSON.stringify(
      {
        eventId: "EVT-9981",
        eventCode: "1000",
        eventName: "Access Granted",
        sourceId: "CTRL-005",
        sourceType: "ACCESS_CONTROLLER",
        sourceName: "North Gate Controller",
        timestamp: new Date().toISOString(),
        metadata: {
          "acs.badgeId": "B-55188",
          "acs.cardholderId": "CH-771",
          "acs.cardholderName": "Alice Smith",
          "acs.doorId": "DGATE-01",
          "acs.doorName": "North Entry Gate",
          "acs.decision": "GRANTED",
          "acs.reasonCodes": ["MATCHED_ACCESS_LEVEL", "VALID_TIMEZONE"],
          panelIp: "10.0.3.9",
          panelName: "Gate Access Panel",
        },
      },
      null,
      2
    )
  );
  const [result, setResult] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleParse = () => {
    try {
      const parsed = JSON.parse(raw);
      const { valid, errors, event } = validateEvent(parsed);
      setResult({ valid, errors });
      if (valid && event) {
        onInject(event);
        toast({
          title: "Event injected",
          description: `${event.eventName} added to the live feed.`,
        });
      }
    } catch {
      setResult({ valid: false, errors: ["Invalid JSON — could not parse"] });
    }
  };

  const handleFormat = () => {
    try {
      setRaw(JSON.stringify(JSON.parse(raw), null, 2));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Paste a SmartConnect Event JSON</p>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleFormat}>
          <Code2 className="h-3.5 w-3.5 mr-1" />
          Format
        </Button>
      </div>

      <Textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setResult(null);
        }}
        className="flex-1 font-mono text-xs resize-none min-h-[280px] bg-muted/30"
        placeholder="Paste JSON here..."
        spellCheck={false}
      />

      {result && (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-xs space-y-1",
            result.valid
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          )}
        >
          {result.valid ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="font-medium">Valid event — injected into feed</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-medium">
                <XCircle className="h-3.5 w-3.5" />
                Validation failed
              </div>
              <ul className="ml-5 list-disc space-y-0.5">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <Button onClick={handleParse} className="w-full">
        <Zap className="h-4 w-4 mr-2" />
        Parse & Inject into Feed
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartConnectPage() {
  const [events, setEvents] = useState<SmartConnectEvent[]>(() => buildInitialEvents());
  const [selectedEvent, setSelectedEvent] = useState<SmartConnectEvent | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSourceType, setFilterSourceType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Auto-generate events while live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const event = generateMockEvent();
      setEvents((prev) => [event, ...prev].slice(0, 200));
      setNewEventIds((prev) => {
        const next = new Set(prev);
        next.add(event.eventId);
        setTimeout(() => {
          setNewEventIds((p) => {
            const s = new Set(p);
            s.delete(event.eventId);
            return s;
          });
        }, 1500);
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isLive]);

  const injectEvent = useCallback((event: SmartConnectEvent) => {
    setEvents((prev) => [event, ...prev]);
    setSelectedEvent(event);
    setNewEventIds((prev) => {
      const next = new Set(prev);
      next.add(event.eventId);
      setTimeout(() => {
        setNewEventIds((p) => {
          const s = new Set(p);
          s.delete(event.eventId);
          return s;
        });
      }, 1500);
      return next;
    });
  }, []);

  const clearFeed = () => {
    setEvents([]);
    setSelectedEvent(null);
    toast({ title: "Feed cleared", description: "All events removed from view." });
  };

  const exportFeed = () => {
    const clean = events.map(({ _receivedAt, _valid, ...e }) => e);
    const blob = new Blob([JSON.stringify(clean, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-connect-events-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter((e) => {
    if (filterSourceType !== "all" && e.sourceType !== filterSourceType) return false;
    if (filterSeverity !== "all" && getSeverity(e) !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.eventId.toLowerCase().includes(q) ||
        e.eventName.toLowerCase().includes(q) ||
        e.sourceName.toLowerCase().includes(q) ||
        (e.sourceType ?? "").toLowerCase().includes(q) ||
        (e.eventCode ?? "").includes(q)
      );
    }
    return true;
  });

  const uniqueSourceTypes = [
    ...new Set(events.map((e) => e.sourceType).filter(Boolean)),
  ] as string[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b bg-background/95 backdrop-blur flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Smart Connect</h1>
            <ConnectionStatusPill live={isLive} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            DigifortSmartConnectEvent stream — test, inspect and validate event data
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive((v) => !v)}
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Resume
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={exportFeed}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={clearFeed}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4 p-6">
        {/* Stats */}
        <StatsBar events={events} />

        {/* Tabs */}
        <Tabs defaultValue="feed" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="feed">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Live Feed
              <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
                {filteredEvents.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="inspector">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              JSON Inspector
            </TabsTrigger>
            <TabsTrigger value="schema">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Schema
            </TabsTrigger>
          </TabsList>

          {/* ── LIVE FEED TAB ── */}
          <TabsContent value="feed" className="flex-1 min-h-0 mt-3">
            <div className="flex gap-3 h-full">
              {/* Filter + Feed */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[160px] max-w-[280px]">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <Select value={filterSourceType} onValueChange={setFilterSourceType}>
                    <SelectTrigger className="h-8 text-sm w-[180px]">
                      <SelectValue placeholder="Source Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Source Types</SelectItem>
                      {uniqueSourceTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="h-8 text-sm w-[140px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchQuery || filterSourceType !== "all" || filterSeverity !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterSourceType("all");
                        setFilterSeverity("all");
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>

                {/* Event list */}
                <Card className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {filteredEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                          <div className="rounded-full bg-muted p-4">
                            <Activity className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No events match your filters
                          </p>
                        </div>
                      ) : (
                        filteredEvents.map((event) => (
                          <EventRow
                            key={event.eventId}
                            event={event}
                            selected={selectedEvent?.eventId === event.eventId}
                            onClick={() =>
                              setSelectedEvent(
                                selectedEvent?.eventId === event.eventId
                                  ? null
                                  : event
                              )
                            }
                            isNew={newEventIds.has(event.eventId)}
                          />
                        ))
                      )}
                      <div ref={feedEndRef} />
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              {/* Detail panel */}
              <Card className="w-[340px] shrink-0 overflow-hidden hidden lg:flex lg:flex-col">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Event Detail
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <EventDetailPanel
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── JSON INSPECTOR TAB ── */}
          <TabsContent value="inspector" className="flex-1 min-h-0 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <Card className="overflow-hidden flex flex-col">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" />
                    Input Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-auto">
                  <JsonInspector onInject={injectEvent} />
                </CardContent>
              </Card>
              <Card className="overflow-hidden flex flex-col">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Injected Event Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <EventDetailPanel
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── SCHEMA TAB ── */}
          <TabsContent value="schema" className="flex-1 min-h-0 mt-3 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">DigifortSmartConnectEvent — Required Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { field: "eventId", type: "string", desc: "Unique identifier of the event" },
                    { field: "eventName", type: "string", desc: "Human-readable name or category of the event" },
                    { field: "sourceId", type: "string", desc: "Identifier of the originating entity/device" },
                    { field: "sourceName", type: "string", desc: "Readable name of the source entity" },
                    { field: "timestamp", type: "date-time", desc: "ISO-8601 timestamp when the event occurred" },
                  ].map((f) => (
                    <div key={f.field} className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px]">
                          required
                        </Badge>
                      </div>
                      <div>
                        <code className="text-sm font-semibold font-mono text-foreground">
                          {f.field}
                        </code>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          {f.type}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Optional Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { field: "eventCode", type: "string", desc: "Unique identifier for event type" },
                    { field: "sourceType", type: "string", desc: "Type classification of originating source" },
                    { field: "metadata", type: "object", desc: "Additional key-value pairs. Values can be string, number, boolean, object, or array." },
                  ].map((f) => (
                    <div key={f.field} className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px]">
                          optional
                        </Badge>
                      </div>
                      <div>
                        <code className="text-sm font-semibold font-mono text-foreground">
                          {f.field}
                        </code>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                          {f.type}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Example Payload</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-md bg-muted/50 p-4 text-xs font-mono overflow-auto">
                    {JSON.stringify(
                      {
                        eventId: "EVT-9981",
                        eventCode: "1000",
                        eventName: "Access Granted",
                        sourceId: "CTRL-005",
                        sourceType: "ACCESS_CONTROLLER",
                        sourceName: "North Gate Controller",
                        timestamp: "2025-12-04T15:35:12.500Z",
                        metadata: {
                          "acs.badgeId": "B-55188",
                          "acs.cardholderId": "CH-771",
                          "acs.cardholderName": "Alice Smith",
                          "acs.doorId": "DGATE-01",
                          "acs.doorName": "North Entry Gate",
                          "acs.decision": "GRANTED",
                          "acs.reasonCodes": ["MATCHED_ACCESS_LEVEL", "VALID_TIMEZONE"],
                          panelIp: "10.0.3.9",
                          panelName: "Gate Access Panel",
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
