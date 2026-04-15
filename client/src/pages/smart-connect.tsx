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
  Radio,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { resolveApiUrl } from "@/lib/queryClient";

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
}

type SseStatus = "connecting" | "connected" | "disconnected" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverity(event: SmartConnectEvent): "info" | "warning" | "critical" {
  const name = event.eventName.toLowerCase();
  if (
    name.includes("denied") ||
    name.includes("forced") ||
    name.includes("intrusion") ||
    name.includes("fire") ||
    name.includes("alarm") ||
    name.includes("breach") ||
    name.includes("tamper") ||
    name.includes("fail")
  )
    return "critical";
  if (
    name.includes("warning") ||
    name.includes("smoke") ||
    name.includes("alert") ||
    name.includes("offline") ||
    name.includes("timeout")
  )
    return "warning";
  return "info";
}

function formatRelativeTime(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
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
  for (const field of ["eventId", "eventName", "sourceId", "sourceName", "timestamp"]) {
    if (!o[field]) errors.push(`Missing required field: "${field}"`);
  }
  if (o.timestamp && isNaN(new Date(o.timestamp as string).getTime())) {
    errors.push(`"timestamp" is not a valid ISO-8601 date-time`);
  }
  if (errors.length > 0) return { valid: false, errors, event: null };
  return {
    valid: true,
    errors: [],
    event: { ...(o as unknown as SmartConnectEvent), _receivedAt: Date.now() },
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

// ─── Connection Status Pill ───────────────────────────────────────────────────

function ConnectionStatusPill({ status }: { status: SseStatus }) {
  const cfg = {
    connecting: {
      label: "Connecting…",
      cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
      dot: "bg-yellow-400 animate-pulse",
    },
    connected: {
      label: "Connected",
      cls: "border-green-500/40 bg-green-500/10 text-green-400",
      dot: "bg-green-400 animate-pulse",
    },
    disconnected: {
      label: "Disconnected",
      cls: "border-muted-foreground/30 bg-muted text-muted-foreground",
      dot: "bg-muted-foreground",
    },
    error: {
      label: "Error",
      cls: "border-red-500/40 bg-red-500/10 text-red-400",
      dot: "bg-red-400",
    },
  }[status];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        cfg.cls
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </div>
  );
}

// ─── Event Row ────────────────────────────────────────────────────────────────

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
              {event.sourceType.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 font-mono">
          <Hash className="h-2.5 w-2.5" />
          {event.eventId}
          {event.eventCode && (
            <span className="ml-1 opacity-60">· code {event.eventCode}</span>
          )}
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

// ─── Event Detail Panel ───────────────────────────────────────────────────────

interface EventDetailPanelProps {
  event: SmartConnectEvent | null;
}

function EventDetailPanel({ event }: EventDetailPanelProps) {
  const { toast } = useToast();

  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
        <div className="rounded-full bg-muted p-4">
          <Radio className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Waiting for an event to be selected…
        </p>
        <p className="text-xs text-muted-foreground/60">
          Events arrive via POST /api/smart-connect/events
        </p>
      </div>
    );
  }

  const severity = getSeverity(event);
  const styles = getSeverityStyles(severity);
  const Icon = getEventIcon(event);

  const copyJson = () => {
    const { _receivedAt, ...clean } = event;
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
            <Server className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Source Types</p>
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
  onInjected: (event: SmartConnectEvent) => void;
}

function JsonInspector({ onInjected }: JsonInspectorProps) {
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
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setResult({ valid: false, errors: ["Invalid JSON — could not parse"] });
      return;
    }

    const { valid, errors } = validateEvent(parsed);
    if (!valid) {
      setResult({ valid: false, errors });
      return;
    }

    setSending(true);
    try {
      const resp = await fetch(resolveApiUrl("/api/smart-connect/events"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });
      const data = await resp.json();
      if (resp.ok && data.ok) {
        setResult({ valid: true, errors: [] });
        toast({ title: "Event sent", description: `Delivered to backend as ${data.eventId}` });
      } else {
        setResult({ valid: false, errors: data.errors ?? ["Server rejected the event"] });
      }
    } catch {
      setResult({ valid: false, errors: ["Network error — could not reach backend"] });
    } finally {
      setSending(false);
    }
  };

  const handleFormat = () => {
    try {
      setRaw(JSON.stringify(JSON.parse(raw), null, 2));
    } catch { /* ignore */ }
  };

  const handleReset = () => {
    setRaw(
      JSON.stringify(
        {
          eventId: `EVT-${Math.floor(Math.random() * 90000) + 10000}`,
          eventCode: "1000",
          eventName: "Access Granted",
          sourceId: "CTRL-005",
          sourceType: "ACCESS_CONTROLLER",
          sourceName: "North Gate Controller",
          timestamp: new Date().toISOString(),
          metadata: {},
        },
        null,
        2
      )
    );
    setResult(null);
  };

  return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">POST a SmartConnect Event to the backend</p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleReset}>
            <RefreshCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleFormat}>
            <Code2 className="h-3.5 w-3.5 mr-1" />
            Format
          </Button>
        </div>
      </div>

      <Textarea
        value={raw}
        onChange={(e) => { setRaw(e.target.value); setResult(null); }}
        className="flex-1 font-mono text-xs resize-none min-h-[280px] bg-muted/30"
        placeholder="Paste JSON here…"
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
              <span className="font-medium">Event accepted — delivered to all connected clients</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 font-medium">
                <XCircle className="h-3.5 w-3.5" />
                Validation failed
              </div>
              <ul className="ml-5 list-disc space-y-0.5">
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      <Button onClick={handleSend} disabled={sending} className="w-full">
        <Zap className="h-4 w-4 mr-2" />
        {sending ? "Sending…" : "Send Event → POST /api/smart-connect/events"}
      </Button>

      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">External integration</p>
        <p>Any system can send events to this endpoint:</p>
        <code className="block bg-muted rounded px-2 py-1 font-mono mt-1">
          POST http://localhost:5000/api/smart-connect/events
        </code>
        <code className="block bg-muted rounded px-2 py-1 font-mono">
          Content-Type: application/json
        </code>
        <p className="mt-1">
          Batch send: <span className="font-mono">POST /api/smart-connect/events/batch</span> with a JSON array.
        </p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFeed({ status }: { status: SseStatus }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div
        className={cn(
          "rounded-full p-5",
          status === "connected" ? "bg-green-500/10" : "bg-muted"
        )}
      >
        {status === "connected" ? (
          <Radio className="h-10 w-10 text-green-400 animate-pulse" />
        ) : (
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="font-medium text-sm">
          {status === "connected"
            ? "Listening for events…"
            : status === "connecting"
            ? "Connecting to event stream…"
            : "Not connected to event stream"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          {status === "connected"
            ? "POST events to /api/smart-connect/events and they will appear here in real time."
            : "Check that the backend server is running."}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartConnectPage() {
  const [events, setEvents] = useState<SmartConnectEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SmartConnectEvent | null>(null);
  const [sseStatus, setSseStatus] = useState<SseStatus>("connecting");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSourceType, setFilterSourceType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // SSE connection
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setSseStatus("connecting");
    const es = new EventSource(resolveApiUrl("/api/smart-connect/events/stream"));
    eventSourceRef.current = es;

    es.onopen = () => {
      setSseStatus("connected");
    };

    es.onmessage = (e) => {
      try {
        const event: SmartConnectEvent = JSON.parse(e.data);
        setEvents((prev) => {
          // Avoid duplicates from the hydration payload
          if (prev.some((p) => p.eventId === event.eventId)) return prev;
          return [event, ...prev].slice(0, 500);
        });
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
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setSseStatus("error");
      es.close();
      // Reconnect after 5 s
      setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => eventSourceRef.current?.close();
  }, [connect]);

  const clearFeed = async () => {
    await fetch(resolveApiUrl("/api/smart-connect/events"), { method: "DELETE" });
    setEvents([]);
    setSelectedEvent(null);
    toast({ title: "Feed cleared", description: "All events removed." });
  };

  const exportFeed = () => {
    const clean = events.map(({ _receivedAt, ...e }) => e);
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
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

  const uniqueSourceTypes = [...new Set(events.map((e) => e.sourceType).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b bg-background/95 backdrop-blur flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Smart Connect</h1>
            <ConnectionStatusPill status={sseStatus} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            DigifortSmartConnectEvent receiver — real-time event stream via SSE
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={connect}
            disabled={sseStatus === "connecting" || sseStatus === "connected"}
          >
            <Wifi className="h-3.5 w-3.5 mr-1.5" />
            Reconnect
          </Button>
          <Button variant="outline" size="sm" onClick={exportFeed} disabled={events.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={clearFeed} disabled={events.length === 0}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4 p-6">
        <StatsBar events={events} />

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

          {/* ── LIVE FEED ── */}
          <TabsContent value="feed" className="flex-1 min-h-0 mt-3">
            <div className="flex gap-3 h-full">
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[160px] max-w-[280px]">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search events…"
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
                          {t.replace(/_/g, " ")}
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

                <Card className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {filteredEvents.length === 0 ? (
                        <EmptyFeed status={sseStatus} />
                      ) : (
                        filteredEvents.map((event) => (
                          <EventRow
                            key={event.eventId}
                            event={event}
                            selected={selectedEvent?.eventId === event.eventId}
                            onClick={() =>
                              setSelectedEvent(
                                selectedEvent?.eventId === event.eventId ? null : event
                              )
                            }
                            isNew={newEventIds.has(event.eventId)}
                          />
                        ))
                      )}
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
                  <EventDetailPanel event={selectedEvent} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── JSON INSPECTOR ── */}
          <TabsContent value="inspector" className="flex-1 min-h-0 mt-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <Card className="overflow-hidden flex flex-col">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5" />
                    Send Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 overflow-auto">
                  <JsonInspector onInjected={(e) => setSelectedEvent(e)} />
                </CardContent>
              </Card>
              <Card className="overflow-hidden flex flex-col">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Last Received Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                  <EventDetailPanel event={events[0] ?? null} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── SCHEMA ── */}
          <TabsContent value="schema" className="flex-1 min-h-0 mt-3 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Required Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { field: "eventId", type: "string", desc: "Unique identifier of the event" },
                    { field: "eventName", type: "string", desc: "Human-readable name or category" },
                    { field: "sourceId", type: "string", desc: "Identifier of the originating device" },
                    { field: "sourceName", type: "string", desc: "Readable name of the source entity" },
                    { field: "timestamp", type: "date-time", desc: "ISO-8601 timestamp when the event occurred" },
                  ].map((f) => (
                    <div key={f.field} className="flex items-start gap-3">
                      <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px] shrink-0 mt-0.5">
                        required
                      </Badge>
                      <div>
                        <code className="text-sm font-semibold font-mono">{f.field}</code>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{f.type}</span>
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
                    { field: "eventCode", type: "string", desc: "Unique identifier for the event type" },
                    { field: "sourceType", type: "string", desc: "Type classification of the originating source" },
                    { field: "metadata", type: "object", desc: "Key-value pairs. Values can be string, number, boolean, object, or array." },
                  ].map((f) => (
                    <div key={f.field} className="flex items-start gap-3">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                        optional
                      </Badge>
                      <div>
                        <code className="text-sm font-semibold font-mono">{f.field}</code>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{f.type}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">API Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    { method: "POST", path: "/api/smart-connect/events", desc: "Send a single SmartConnectEvent (JSON body)" },
                    { method: "POST", path: "/api/smart-connect/events/batch", desc: "Send an array of SmartConnectEvent objects" },
                    { method: "GET",  path: "/api/smart-connect/events", desc: "Retrieve stored events (?limit=N, default 200)" },
                    { method: "GET",  path: "/api/smart-connect/events/stream", desc: "SSE stream — push events in real time to this page" },
                    { method: "DELETE", path: "/api/smart-connect/events", desc: "Clear all stored events" },
                  ].map((e) => (
                    <div key={e.path} className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className={cn("font-mono text-[10px] shrink-0 mt-0.5", {
                          "border-green-500/30 text-green-400": e.method === "GET",
                          "border-blue-500/30 text-blue-400": e.method === "POST",
                          "border-red-500/30 text-red-400": e.method === "DELETE",
                        })}
                      >
                        {e.method}
                      </Badge>
                      <div>
                        <code className="font-mono text-xs">{e.path}</code>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.desc}</p>
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
{`{
  "eventId": "EVT-9981",
  "eventCode": "1000",
  "eventName": "Access Granted",
  "sourceId": "CTRL-005",
  "sourceType": "ACCESS_CONTROLLER",
  "sourceName": "North Gate Controller",
  "timestamp": "2025-12-04T15:35:12.500Z",
  "metadata": {
    "acs.badgeId": "B-55188",
    "acs.cardholderId": "CH-771",
    "acs.cardholderName": "Alice Smith",
    "acs.doorId": "DGATE-01",
    "acs.doorName": "North Entry Gate",
    "acs.decision": "GRANTED",
    "acs.reasonCodes": ["MATCHED_ACCESS_LEVEL", "VALID_TIMEZONE"],
    "panelIp": "10.0.3.9",
    "panelName": "Gate Access Panel"
  }
}`}
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
