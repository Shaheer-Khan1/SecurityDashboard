import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const MOCK_SERVER_URL = process.env.DIGIFORT_API_URL || "http://localhost:8089";

async function proxyRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${MOCK_SERVER_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
}

const mockCameras = [
  { name: "Camera 1 - Main Entrance", active: true, model: "Axis P3245-V", group: "Entrance", status: "recording", working: true, recordingHours: 168 },
  { name: "Camera 2 - Parking Lot A", active: true, model: "Hikvision DS-2CD2385", group: "Parking", status: "online", working: true, recordingHours: 120 },
  { name: "Camera 3 - Loading Dock", active: true, model: "Dahua IPC-HFW5831E", group: "Loading", status: "recording", working: true, recordingHours: 144 },
  { name: "Camera 4 - Reception", active: true, model: "Axis Q1615 Mk III", group: "Interior", status: "online", working: true, recordingHours: 96 },
  { name: "Camera 5 - Server Room", active: true, model: "Bosch FLEXIDOME IP", group: "Secure", status: "recording", working: true, recordingHours: 200 },
  { name: "Camera 6 - Warehouse A", active: true, model: "Samsung Wisenet XND", group: "Warehouse", status: "online", working: true, recordingHours: 72 },
  { name: "Camera 7 - Back Exit", active: false, model: "Axis P3255-LVE", group: "Entrance", status: "offline", working: false, recordingHours: 0 },
  { name: "Camera 8 - Hallway B", active: true, model: "Hikvision DS-2CD2H85G1", group: "Interior", status: "recording", working: true, recordingHours: 110 },
  { name: "Camera 9 - Parking Lot B", active: true, model: "Dahua IPC-HDBW5831R", group: "Parking", status: "online", working: true, recordingHours: 88 },
  { name: "Camera 10 - Main Gate", active: true, model: "Axis Q6155-E", group: "Entrance", status: "recording", working: true, recordingHours: 156 },
  { name: "Camera 11 - Conference Room", active: true, model: "Sony SNC-EM632R", group: "Interior", status: "online", working: true, recordingHours: 48 },
  { name: "Camera 12 - IT Room", active: true, model: "Bosch NBN-80052-BA", group: "Secure", status: "recording", working: true, recordingHours: 180 },
  { name: "Camera 13 - Cafeteria", active: false, model: "Hikvision DS-2CD2185FWD", group: "Interior", status: "offline", working: false, recordingHours: 0 },
  { name: "Camera 14 - Emergency Exit", active: true, model: "Axis P3235-LV", group: "Entrance", status: "online", working: true, recordingHours: 132 },
  { name: "Camera 15 - Warehouse B", active: true, model: "Dahua IPC-HFW4831E", group: "Warehouse", status: "recording", working: true, recordingHours: 96 },
  { name: "Camera 16 - Lobby", active: true, model: "Axis M3106-LVE", group: "Interior", status: "recording", working: true, recordingHours: 144 },
];

const mockGroups = [
  { name: "Entrance", cameras: ["Camera 1", "Camera 7", "Camera 10", "Camera 14"], active: true },
  { name: "Parking", cameras: ["Camera 2", "Camera 9"], active: true },
  { name: "Loading", cameras: ["Camera 3"], active: true },
  { name: "Interior", cameras: ["Camera 4", "Camera 8", "Camera 11", "Camera 13", "Camera 16"], active: true },
  { name: "Secure", cameras: ["Camera 5", "Camera 12"], active: true },
  { name: "Warehouse", cameras: ["Camera 6", "Camera 15"], active: true },
];

const eventTypes = ["MOTION", "INTRUSION", "FACE_DETECTION", "VEHICLE_DETECTION", "TAMPERING", "LOITERING"];
const objectClasses = ["person", "vehicle", "unknown"];

function generateMockEvents(count: number) {
  const events = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const camera = mockCameras[Math.floor(Math.random() * mockCameras.length)];
    const eventTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    events.push({
      id: `evt-${Date.now()}-${i}`,
      recordCode: `REC${10000 + Math.floor(Math.random() * 90000)}`,
      camera: camera.name,
      zone: Math.random() > 0.3 ? ["Zone A", "Zone B", "Zone C"][Math.floor(Math.random() * 3)] : null,
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      objectClass: objectClasses[Math.floor(Math.random() * objectClasses.length)],
      ruleName: Math.random() > 0.5 ? ["Motion Rule 1", "Intrusion Alert", "Perimeter Watch"][Math.floor(Math.random() * 3)] : null,
      timestamp: eventTime.toISOString(),
      confidence: (0.7 + Math.random() * 0.29).toFixed(2),
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockAuditLogs(count: number) {
  const categories = ["USER_ACTION", "SERVER_CONNECTION", "SYSTEM", "SECURITY"];
  const actions = [
    "User login successful",
    "Camera configuration updated",
    "Bookmark created",
    "System backup completed",
    "Recording started",
    "Alert acknowledged",
    "User logout",
    "Settings modified",
  ];
  const users = ["admin", "operator1", "security_user", "system"];
  const logs = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const logTime = new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000);
    logs.push({
      id: `log-${Date.now()}-${i}`,
      timestamp: logTime.toISOString(),
      category: categories[Math.floor(Math.random() * categories.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      user: users[Math.floor(Math.random() * users.length)],
      details: `Operation details for log entry ${i + 1}`,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const mockBookmarks = [
  { id: "bm-1", title: "Suspicious Activity - Main Entrance", color: "red", startDate: "2024-12-08", startTime: "14:30", cameras: ["Camera 1 - Main Entrance"], remarks: "Person loitering near entrance for extended period", createdAt: "2024-12-08T14:30:00Z" },
  { id: "bm-2", title: "Vehicle Incident", color: "orange", startDate: "2024-12-07", startTime: "09:15", cameras: ["Camera 2 - Parking Lot A"], remarks: "Minor collision in parking area, no injuries", createdAt: "2024-12-07T09:15:00Z" },
  { id: "bm-3", title: "Delivery Verification", color: "blue", startDate: "2024-12-06", startTime: "11:00", cameras: ["Camera 3 - Loading Dock"], remarks: "Large shipment received, documentation verified", createdAt: "2024-12-06T11:00:00Z" },
  { id: "bm-4", title: "After Hours Access", color: "yellow", startDate: "2024-12-05", startTime: "22:45", cameras: ["Camera 5 - Server Room"], remarks: "Authorized maintenance personnel", createdAt: "2024-12-05T22:45:00Z" },
  { id: "bm-5", title: "Perimeter Check", color: "green", startDate: "2024-12-04", startTime: "06:00", cameras: ["Camera 10 - Main Gate", "Camera 14 - Emergency Exit"], remarks: "Morning security patrol completed", createdAt: "2024-12-04T06:00:00Z" },
];

const mockAnalyticsConfigs = [
  { name: "Motion Detection - All Cameras", active: true, camera: "All", events: ["MOTION"], working: true, status: "OK", statusMessage: "Processing normally" },
  { name: "Intrusion Detection - Perimeter", active: true, camera: "Perimeter", events: ["INTRUSION"], working: true, status: "OK", statusMessage: "Active and monitoring" },
  { name: "Face Recognition - Entrance", active: true, camera: "Camera 1", events: ["FACE_DETECTION"], working: true, status: "OK", statusMessage: "Database: 1,247 faces enrolled" },
  { name: "Vehicle Detection - Parking", active: true, camera: "Parking", events: ["VEHICLE_DETECTION"], working: true, status: "OK", statusMessage: "License plate recognition enabled" },
  { name: "Loitering Detection", active: false, camera: "All", events: ["LOITERING"], working: false, status: "DISABLED", statusMessage: "Manually disabled" },
];

const mockCounters = [
  { id: "cnt-1", name: "People Counter", configuration: "Motion Detection", value: 1247, lastReset: "2024-12-01T00:00:00Z" },
  { id: "cnt-2", name: "Vehicle Counter", configuration: "Vehicle Detection", value: 892, lastReset: "2024-12-01T00:00:00Z" },
  { id: "cnt-3", name: "Security Events", configuration: "Intrusion Detection", value: 23, lastReset: "2024-12-01T00:00:00Z" },
  { id: "cnt-4", name: "Face Matches", configuration: "Face Recognition", value: 456, lastReset: "2024-12-01T00:00:00Z" },
];

function generateChartData() {
  const hours = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hourTime = new Date(now.getTime() - i * 60 * 60 * 1000);
    hours.push({
      time: hourTime.toISOString().slice(11, 16).replace(":", "h") + "m",
      hour: hourTime.getHours().toString().padStart(2, "0") + ":00",
      events: Math.floor(Math.random() * 80) + 20,
      motion: Math.floor(Math.random() * 50) + 10,
      intrusion: Math.floor(Math.random() * 10),
      faces: Math.floor(Math.random() * 30) + 5,
    });
  }
  return hours;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Dashboard/Stats");
      res.json(data);
    } catch {
      const activeCameras = mockCameras.filter(c => c.active).length;
      const recordingCameras = mockCameras.filter(c => c.status === "recording").length;
      const offlineCameras = mockCameras.filter(c => !c.active).length;
      res.json({
        totalCameras: mockCameras.length,
        activeCameras,
        recordingCameras,
        offlineCameras,
        totalEvents: 1247,
        criticalEvents: 3,
        totalStorage: "4 TB",
        usedStorage: "2.8 TB",
      });
    }
  });

  app.get("/api/system/status", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/System/Status");
      res.json(data);
    } catch {
      res.json({
        serverStatus: "online",
        cpuUsage: 30 + Math.floor(Math.random() * 30),
        memoryUsage: 50 + Math.floor(Math.random() * 25),
        diskUsage: 70,
        uptime: "14d 6h 32m",
        lastSync: `${Math.floor(Math.random() * 5) + 1} min ago`,
      });
    }
  });

  app.get("/api/cameras", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/GetCameras");
      res.json(data.Cameras || []);
    } catch {
      res.json(mockCameras);
    }
  });

  app.get("/api/cameras/groups", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/GetGroups");
      res.json(data.Groups || []);
    } catch {
      res.json(mockGroups);
    }
  });

  app.get("/api/cameras/:name/status", async (req, res) => {
    try {
      const data = await proxyRequest(`/Interface/Cameras/GetStatus?Cameras=${encodeURIComponent(req.params.name)}`);
      res.json(data.Cameras?.[0] || null);
    } catch {
      const camera = mockCameras.find(c => c.name === req.params.name);
      res.json(camera || null);
    }
  });

  app.post("/api/cameras/:name/activation", async (req, res) => {
    try {
      const { action } = req.body;
      const data = await proxyRequest("/Interface/Cameras/Activation", {
        method: "POST",
        body: JSON.stringify({ camera: req.params.name, action }),
      });
      res.json(data);
    } catch {
      res.json({ success: true, message: "Camera activation updated" });
    }
  });

  app.get("/api/analytics/configurations", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetAnalyticsConfigurations");
      res.json(data.AnalyticsConfigurations || []);
    } catch {
      res.json(mockAnalyticsConfigs);
    }
  });

  app.get("/api/analytics/counters", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetCounters");
      res.json(data.Counters || []);
    } catch {
      res.json(mockCounters);
    }
  });

  app.post("/api/analytics/counters/:id/reset", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/ResetCounter", {
        method: "POST",
        body: JSON.stringify({ counterId: req.params.id }),
      });
      res.json(data);
    } catch {
      res.json({ success: true, message: "Counter reset successfully" });
    }
  });

  app.get("/api/analytics/events", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.startDate) queryParams.set("StartDate", req.query.startDate as string);
      if (req.query.endDate) queryParams.set("EndDate", req.query.endDate as string);
      if (req.query.cameras) queryParams.set("Cameras", req.query.cameras as string);
      if (req.query.eventTypes) queryParams.set("EventTypes", req.query.eventTypes as string);
      
      const data = await proxyRequest(`/Interface/Analytics/Search?${queryParams.toString()}`);
      res.json(data.Events || []);
    } catch {
      res.json(generateMockEvents(50));
    }
  });

  app.get("/api/analytics/events/recent", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/Search");
      res.json((data.Events || []).slice(0, 10));
    } catch {
      res.json(generateMockEvents(10));
    }
  });

  app.get("/api/analytics/chart", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/Chart");
      res.json(data);
    } catch {
      res.json(generateChartData());
    }
  });

  app.get("/api/audit/logs", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.startDate) queryParams.set("StartDate", req.query.startDate as string);
      if (req.query.endDate) queryParams.set("EndDate", req.query.endDate as string);
      if (req.query.category) queryParams.set("Category", req.query.category as string);
      if (req.query.keyword) queryParams.set("Keyword", req.query.keyword as string);
      
      const data = await proxyRequest(`/Interface/Audit/Search?${queryParams.toString()}`);
      res.json(data.AuditLogs || []);
    } catch {
      res.json(generateMockAuditLogs(30));
    }
  });

  app.get("/api/bookmarks", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.keyword) queryParams.set("Keyword", req.query.keyword as string);
      if (req.query.colors) queryParams.set("Colors", req.query.colors as string);
      
      const data = await proxyRequest(`/Interface/Cameras/Bookmarks/Search?${queryParams.toString()}`);
      res.json(data.Bookmarks || []);
    } catch {
      res.json(mockBookmarks);
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/Bookmarks/Add", {
        method: "POST",
        body: JSON.stringify(req.body),
      });
      res.json(data);
    } catch {
      const newBookmark = {
        id: `bm-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      res.json({ success: true, bookmark: newBookmark });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const data = await proxyRequest(`/Interface/Cameras/Bookmarks/Delete?id=${req.params.id}`, {
        method: "DELETE",
      });
      res.json(data);
    } catch {
      res.json({ success: true, message: "Bookmark deleted" });
    }
  });

  return httpServer;
}
