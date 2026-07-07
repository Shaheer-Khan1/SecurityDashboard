/**
 * Digifort API Proxy Routes
 * 
 * This module provides a proxy layer between the frontend and the Digifort API.
 * It handles:
 * - Authentication (both Basic and Safe methods)
 * - API request proxying with proper headers
 * - Response parsing (JSON and XML formats)
 * - Data transformation from Digifort format to frontend format
 * - Error handling and retry logic
 * 
 * The proxy allows the frontend to make requests to /api/* endpoints,
 * which are then forwarded to the Digifort API with authentication.
 */

import type { Express, Request as ExpressRequest, Response as ExpressResponse } from "express";
import { type Server } from "http";
import { addAuthToUrl, getBasicAuthHeader } from "./auth";

// ─── SmartConnect in-memory store + SSE ──────────────────────────────────────

interface SmartConnectEvent {
  eventId: string;
  eventCode?: string;
  eventName: string;
  sourceId: string;
  sourceType?: string;
  sourceName: string;
  isAlarm?: boolean;
  timestamp: string;
  metadata?: Record<string, unknown>;
  _receivedAt: number;
}

const smartConnectEvents: SmartConnectEvent[] = [];
const smartConnectClients: ExpressResponse[] = [];
const MAX_STORED_EVENTS = 500;

function broadcastSmartConnectEvent(event: SmartConnectEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of smartConnectClients) {
    try { client.write(payload); } catch { /* client disconnected */ }
  }
}

function validateSmartConnectEvent(body: unknown): { valid: boolean; errors: string[]; event: SmartConnectEvent | null } {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Body must be a JSON object"], event: null };
  }
  const o = body as Record<string, unknown>;

  const allowedTopLevelFields = new Set([
    "eventId",
    "eventCode",
    "eventName",
    "sourceId",
    "sourceType",
    "sourceName",
    "isAlarm",
    "timestamp",
    "metadata",
  ]);

  for (const key of Object.keys(o)) {
    if (!allowedTopLevelFields.has(key)) {
      errors.push(`Unexpected field: "${key}"`);
    }
  }

  for (const field of ["eventId", "eventName", "sourceId", "sourceName", "timestamp"]) {
    if (!o[field]) errors.push(`Missing required field: "${field}"`);
  }

  if (o.eventId !== undefined && typeof o.eventId !== "string") {
    errors.push(`"eventId" must be a string`);
  }
  if (o.eventCode !== undefined && typeof o.eventCode !== "string") {
    errors.push(`"eventCode" must be a string`);
  }
  if (o.eventName !== undefined && typeof o.eventName !== "string") {
    errors.push(`"eventName" must be a string`);
  }
  if (o.sourceId !== undefined && typeof o.sourceId !== "string") {
    errors.push(`"sourceId" must be a string`);
  }
  if (o.sourceType !== undefined && typeof o.sourceType !== "string") {
    errors.push(`"sourceType" must be a string`);
  }
  if (o.sourceName !== undefined && typeof o.sourceName !== "string") {
    errors.push(`"sourceName" must be a string`);
  }
  if (o.isAlarm !== undefined && typeof o.isAlarm !== "boolean") {
    errors.push(`"isAlarm" must be a boolean`);
  }
  if (o.metadata !== undefined && (typeof o.metadata !== "object" || o.metadata === null || Array.isArray(o.metadata))) {
    errors.push(`"metadata" must be an object`);
  }

  const isValidMetadataValue = (value: unknown): boolean => {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.every(
        (item) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean" ||
          (typeof item === "object" && item !== null && !Array.isArray(item))
      );
    }
    return typeof value === "object" && value !== null && !Array.isArray(value);
  };

  if (o.metadata && typeof o.metadata === "object" && !Array.isArray(o.metadata)) {
    for (const [key, value] of Object.entries(o.metadata as Record<string, unknown>)) {
      if (!isValidMetadataValue(value)) {
        errors.push(`"metadata.${key}" has an unsupported value type`);
      }
    }
  }

  if (o.timestamp && isNaN(new Date(o.timestamp as string).getTime())) {
    errors.push(`"timestamp" must be a valid ISO-8601 date-time`);
  }
  if (errors.length > 0) return { valid: false, errors, event: null };
  return {
    valid: true,
    errors: [],
    event: { ...(o as unknown as SmartConnectEvent), _receivedAt: Date.now() },
  };
}
// ─────────────────────────────────────────────────────────────────────────────

// Digifort API base URL
// ============================================
// DIGIFORT API CONFIGURATION (ACTIVE)
// ============================================
const DIGIFORT_API_URL = process.env.DIGIFORT_API_URL || "http://192.168.100.164:8601";

// Debug counters for logging
let proxyRequestLogCount = 0;
let proxyRequestFirstFailure = false;

/**
 * Send error response when upstream API is unavailable
 * 
 * @param res - Express response object
 * @param _error - The error that occurred (unused, kept for future logging)
 */
function upstreamError(res: ExpressResponse, _error: unknown) {
  res.status(502).json({ message: "Upstream API unavailable" });
}

/**
 * Parse Digifort API response (handles both JSON and XML)
 * 
 * Digifort API can return responses in multiple formats:
 * - JSON: {"Response":{"Code":0,"Data":{...}}}
 * - XML: <Response><Data>...</Data></Response>
 * - Plain JSON without content-type header
 * 
 * This function detects the format and parses accordingly.
 * 
 * @param response - Fetch API Response object from Digifort API
 * @returns Parsed response data as a JavaScript object
 * @throws Error if the response format is not supported
 */
async function parseDigifortResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") || "";
  
  // Log response details for debugging
  console.log(`[PROXY] Response status: ${response.status} ${response.statusText}`);
  console.log(`[PROXY] Response content-type: ${contentType || '(empty)'}`);
  
  if (contentType.includes("application/json") || contentType.includes("text/json")) {
    return await response.json();
  } else {
    // Try to parse as JSON first (might be JSON without proper content-type)
    const text = await response.text();
    
    // Log first 500 chars of response for debugging
    console.log(`[PROXY] Response body (first 500 chars): ${text.substring(0, 500)}`);
    
    if (text.trim().startsWith("<?xml") || text.trim().startsWith("<Response")) {
      // XML response - would need XML parser, but for now throw error with helpful message
      throw new Error(`XML response not yet fully supported. Response: ${text.substring(0, 500)}`);
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Unsupported response format. Content-Type: ${contentType}, Response: ${text.substring(0, 500)}`);
    }
  }
}

/**
 * Transform Digifort camera object to frontend schema format
 * 
 * The Digifort API uses PascalCase field names (Name, Active, Group),
 * while the frontend expects camelCase (name, active, group).
 * 
 * This function transforms a camera object from Digifort format to frontend format:
 * - Name -> name
 * - Active -> active
 * - DeviceType -> deviceType
 * - ConnectionAddress -> connectionAddress
 * etc.
 * 
 * @param camera - Camera object from Digifort API
 * @returns Camera object in frontend format, or null if input is invalid
 */
function transformCamera(camera: any): any {
  if (!camera) return null;
  
  return {
    name: camera.Name || camera.name || "",
    active: camera.Active !== undefined ? camera.Active : (camera.active !== undefined ? camera.active : false),
    model: camera.Model || camera.model,
    deviceType: camera.DeviceType !== undefined ? String(camera.DeviceType) : camera.deviceType,
    connectionAddress: camera.ConnectionAddress || camera.connectionAddress,
    connectionPort: camera.ConnectionPort !== undefined ? Number(camera.ConnectionPort) : camera.connectionPort,
    latitude: camera.Latitude !== undefined ? Number(camera.Latitude) : camera.latitude,
    longitude: camera.Longitude !== undefined ? Number(camera.Longitude) : camera.longitude,
    memo: camera.Memo || camera.memo,
    group: camera.Group || camera.group,
    status: camera.Status || camera.status,
    working: camera.Working !== undefined ? camera.Working : camera.working,
    recordingHours: camera.RecordingHours !== undefined ? Number(camera.RecordingHours) : camera.recordingHours,
    description: camera.Description || camera.description,
  };
}

/**
 * Transform Digifort group object to frontend schema format
 * 
 * Converts group data from Digifort PascalCase format to frontend camelCase:
 * - Name -> name
 * - Cameras -> cameras
 * - Active -> active
 * 
 * @param group - Group object from Digifort API
 * @returns Group object in frontend format, or null if input is invalid
 */
function transformGroup(group: any): any {
  if (!group) return null;
  
  return {
    name: group.Name || group.name || "",
    cameras: group.Cameras || group.cameras || [],
    active: group.Active !== undefined ? group.Active : (group.active !== undefined ? group.active : false),
  };
}

/**
 * Extract data from Digifort API response structure
 * 
 * Digifort API wraps responses in a standard structure:
 * {
 *   "Response": {
 *     "Code": 0,
 *     "Message": "OK",
 *     "Data": {
 *       "Cameras": [...],  // Actual data is here
 *       "Groups": [...],
 *       etc.
 *     }
 *   }
 * }
 * 
 * This function extracts the actual data from this wrapper structure.
 * It also handles direct data responses (when the API doesn't use the wrapper).
 * 
 * @param responseData - The full response object from Digifort API
 * @param dataKey - Optional key to extract from the Data object (e.g., "Cameras")
 * @returns The extracted data, or the original response if no wrapper is found
 */
function extractDigifortData(responseData: any, dataKey?: string): any {
  // If response has Digifort structure: { Response: { Data: { ... } } }
  if (responseData.Response?.Data) {
    if (dataKey) {
      return responseData.Response.Data[dataKey] || responseData.Response.Data;
    }
    return responseData.Response.Data;
  }
  
  // If response is direct data
  if (dataKey && responseData[dataKey]) {
    return responseData[dataKey];
  }
  
  // Return as-is
  return responseData;
}

/** Normalize Digifort AnalyticsRecord or frontend Event into a consistent alert shape. */
function normalizeAlert(record: any): any {
  const alarmStatus = (record.AlarmStatus ?? record.alarmStatus ?? "ACTIVE").toString().toUpperCase();
  return {
    id: String(record.RecordCode ?? record.id ?? ""),
    recordCode: String(record.RecordCode ?? record.recordCode ?? ""),
    camera: record.Camera ?? record.camera ?? "",
    zone: record.Zone ?? record.zone,
    eventType: record.EventType ?? record.eventType ?? "MOTION",
    objectClass: (record.ObjectClass ?? record.objectClass ?? "").toString().toLowerCase(),
    ruleName: record.RuleName ?? record.ruleName,
    timestamp: record.StartDate ?? record.timestamp ?? "",
    alarmStatus: alarmStatus === "ACTIVE" ? "active" : "closed",
    region: record.Region ?? record.region ?? "Unknown",
    site: record.Site ?? record.site ?? "Unknown",
    severity: record.Severity ?? record.severity ?? "Medium",
    description: record.Description ?? record.description ?? "",
    isAlarm: true,
  };
}

function extractAlerts(responseData: any): any[] {
  const events = extractDigifortData(responseData, "Events");
  if (Array.isArray(events) && events.length > 0) {
    return events.map((e: any) => (e.region || e.alarmStatus ? e : normalizeAlert(e)));
  }
  const records = extractDigifortData(responseData, "AnalyticsRecords");
  if (Array.isArray(records) && records.length > 0) {
    return records.map(normalizeAlert);
  }
  return [];
}

function buildAlarmSummaryFromAlerts(alerts: any[]) {
  const summary: Record<string, { active: number; closed: number; sites: Record<string, { active: number; closed: number }> }> = {};
  for (const alert of alerts) {
    const region = alert.region || "Unknown";
    const site = alert.site || "Unknown";
    const key = alert.alarmStatus === "active" ? "active" : "closed";
    if (!summary[region]) summary[region] = { active: 0, closed: 0, sites: {} };
    summary[region][key]++;
    if (!summary[region].sites[site]) summary[region].sites[site] = { active: 0, closed: 0 };
    summary[region].sites[site][key]++;
  }
  return transformAlarmSummary({ AlarmSummary: summary });
}

function transformAlarmSummary(raw: any) {
  const summary = extractDigifortData(raw, "AlarmSummary") ?? raw?.AlarmSummary ?? raw ?? {};
  const regions: any[] = [];
  let totalActive = 0;
  let totalClosed = 0;

  for (const [name, data] of Object.entries(summary)) {
    const d = data as { active?: number; closed?: number; sites?: Record<string, { active?: number; closed?: number }> };
    const active = d.active ?? 0;
    const closed = d.closed ?? 0;
    totalActive += active;
    totalClosed += closed;
    regions.push({
      name,
      active,
      closed,
      total: active + closed,
      sites: Object.entries(d.sites ?? {})
        .map(([siteName, siteData]) => ({
          name: siteName,
          active: siteData.active ?? 0,
          closed: siteData.closed ?? 0,
          total: (siteData.active ?? 0) + (siteData.closed ?? 0),
        }))
        .sort((a, b) => b.active - a.active),
    });
  }

  return {
    totals: { active: totalActive, closed: totalClosed, total: totalActive + totalClosed },
    regions: regions.sort((a, b) => b.active - a.active),
  };
}

/**
 * Proxy request to Mock Server (or Digifort API if configured)
 * 
 * This function forwards requests to either:
 * - Mock Server (default): http://localhost:8089 - provides sample data
 * - Digifort API (if configured): Real security platform API
 * 
 * For Mock Server:
 * - No authentication required
 * - Returns sample data for all features
 * - Run with: python mock_server/app.py
 * 
 * For Digifort API (commented out):
 * 1. Adds authentication (Basic Auth header or Safe Auth URL parameters)
 * 2. Sends the request to the Digifort API
 * 3. Handles authentication errors (Code 101) with automatic retry
 * 4. Parses and returns the response
 * 
 * @param endpoint - The API endpoint path (e.g., "/Interface/Cameras/GetCameras")
 * @param options - Fetch API options (method, headers, body, etc.)
 * @param retryCount - Current retry count (used internally, starts at 0)
 * @returns Promise that resolves to the parsed response data
 * @throws Error if the request fails after retries
 */
async function proxyRequest(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<any> {
  try {
    // ============================================
    // DIGIFORT API MODE (ACTIVE)
    // ============================================
    // Add ResponseFormat=JSON to request JSON format explicitly
    const separator = endpoint.includes("?") ? "&" : "?";
    const endpointWithFormat = `${endpoint}${separator}ResponseFormat=JSON`;

    // Basic auth → Authorization header; Safe auth → AuthSession/AuthData query params
    const authenticatedUrl = await addAuthToUrl(`${DIGIFORT_API_URL}${endpointWithFormat}`);
    const basicAuthHeader = getBasicAuthHeader();

    // Prepare headers
    const headers: Record<string, string> = {
      "Accept": "application/json",
      ...options.headers as Record<string, string>,
    };
    const method = (options.method || "GET").toUpperCase();
    if (options.body !== undefined && options.body !== null && method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
    }

    if (basicAuthHeader) {
      headers["Authorization"] = basicAuthHeader;
    }

    // Debug: Log URL for first few requests (mask sensitive data)
    if (proxyRequestLogCount < 3) {
      const maskedUrl = authenticatedUrl
        .replace(/AuthPass=[^&]+/i, "AuthPass=***")
        .replace(/AuthData=[A-F0-9]+/i, "AuthData=***");
      console.log(`[PROXY] Request URL: ${maskedUrl}`);
      console.log(`[PROXY] Auth Method: ${process.env.DIGIFORT_AUTH_METHOD || "basic"}`);
      if (basicAuthHeader) {
        const maskedAuth = basicAuthHeader.substring(0, 15) + "***";
        console.log(`[PROXY] Authorization Header: ${maskedAuth}`);
      } else {
        console.log(`[PROXY] Auth Mode: Safe (AuthSession/AuthData query params)`);
      }
      proxyRequestLogCount++;
    }
    
    const response = await fetch(authenticatedUrl, {
      ...options,
      headers,
    }).catch((fetchError) => {
      // Log detailed fetch error
      console.error(`[PROXY] Fetch failed for ${endpoint}:`);
      console.error(`[PROXY]   URL: ${authenticatedUrl}`);
      console.error(`[PROXY]   Error: ${fetchError.message}`);
      if (fetchError.cause) {
        console.error(`[PROXY]   Cause: ${fetchError.cause.code} - ${fetchError.cause.message}`);
      }
      throw fetchError;
    });

    // Fail fast on HTTP auth errors before trying to parse HTML login pages as JSON
    if (response.status === 401 || response.status === 403) {
      if (response.status === 401) {
        console.error(`[PROXY] 401 Unauthorized for ${endpoint}`);
        if (basicAuthHeader) {
          console.error(`[PROXY] Basic auth header was sent but rejected by server.`);
          console.error(`[PROXY] Verify DIGIFORT_USERNAME / DIGIFORT_PASSWORD are correct`);
        } else {
          console.error(`[PROXY] Safe auth session may be invalid — check credentials`);
        }
        throw new Error(`Authentication failed: 401 Unauthorized`);
      }

      if (retryCount === 0 && process.env.DIGIFORT_AUTH_METHOD !== "basic") {
        console.log(`[PROXY] Authentication failed (${response.status}) for ${endpoint}, retrying...`);
        const { clearAuthSession } = await import("./auth");
        await clearAuthSession();
        await new Promise(resolve => setTimeout(resolve, 200));
        return await proxyRequest(endpoint, options, retryCount + 1);
      }

      console.error(`[PROXY] Authentication failed for ${endpoint}: ${response.status}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Parse response to check for authentication errors in response body
    const responseData = await parseDigifortResponse(response);
    
    // Check for authentication error (Code 101) in response body
    if (responseData.Response?.Code === 101 || responseData.Code === 101) {
      if (retryCount === 0 && process.env.DIGIFORT_AUTH_METHOD !== "basic") {
        // Only retry with Safe auth
        if (!proxyRequestFirstFailure) {
          const maskedUrl = authenticatedUrl.replace(/AuthData=[A-F0-9]+/i, 'AuthData=***');
          console.log(`[PROXY] Authentication error (Code 101) for ${endpoint}`);
          console.log(`[PROXY] Request URL: ${maskedUrl}`);
          proxyRequestFirstFailure = true;
        }
        
        console.log(`[PROXY] Clearing session and retrying ${endpoint}...`);
        const { clearAuthSession } = await import("./auth");
        await clearAuthSession();
        await new Promise(resolve => setTimeout(resolve, 200));
        return await proxyRequest(endpoint, options, retryCount + 1);
      } else {
        console.error(`[PROXY] Authentication failed for ${endpoint}`);
        return responseData;
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Request failed for ${endpoint}: ${response.status}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`[PROXY] Error in proxyRequest for ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Register all API routes for the application
 * 
 * This function sets up all the Express routes that proxy requests to the Digifort API:
 * 
 * Dashboard & System:
 * - GET /api/dashboard/stats - System statistics (camera counts, events, storage)
 * - GET /api/system/status - System status (CPU, memory, uptime)
 * 
 * Cameras:
 * - GET /api/cameras - Get all cameras
 * - GET /api/cameras/groups - Get camera groups
 * - GET /api/cameras/:name/status - Get status of specific camera
 * - POST /api/cameras/:name/activation - Activate/deactivate a camera
 * 
 * Analytics:
 * - GET /api/analytics/configurations - Get analytics configurations
 * - GET /api/analytics/counters - Get analytics counters
 * - POST /api/analytics/counters/:id/reset - Reset a counter
 * - GET /api/analytics/events - Search for events (with filters)
 * - GET /api/analytics/events/recent - Get recent events
 * - GET /api/analytics/chart - Get chart data for analytics
 * 
 * Audit:
 * - GET /api/audit/logs - Search audit logs (with filters)
 * 
 * Bookmarks:
 * - GET /api/bookmarks - Search bookmarks
 * - POST /api/bookmarks - Create a new bookmark
 * - DELETE /api/bookmarks/:id - Delete a bookmark
 * 
 * All routes handle errors gracefully and return 502 Bad Gateway if the
 * upstream Digifort API is unavailable.
 * 
 * @param httpServer - HTTP server instance
 * @param app - Express application instance
 * @returns Promise that resolves to the HTTP server
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  /**
   * GET /health
   * Simple health check endpoint (doesn't require mock server)
   */
  app.get("/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      mockServerUrl: process.env.MOCK_SERVER_URL || "not set",
      nodeEnv: process.env.NODE_ENV || "not set"
    });
  });
  
  /**
   * GET /api/dashboard/stats
   * 
   * Get dashboard statistics from Digifort API including:
   * - Total cameras, active cameras, working cameras, offline cameras
   * - Recording cameras, configured to record, waiting to disk
   * - Total FPS and recorded FPS
   * - Server usage information
   * 
   * This endpoint aggregates data from multiple Digifort API endpoints:
   * - /Interface/Cameras/GetCameras - Get all cameras
   * - /Interface/Cameras/GetStatus - Get camera status
   * - /Interface/Server/GetUsage - Get server usage stats
   */
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Fetch cameras and their status in parallel
      const [camerasData, statusData] = await Promise.all([
        proxyRequest("/Interface/Cameras/GetCameras"),
        proxyRequest("/Interface/Cameras/GetStatus"),
      ]);
      
      // Extract camera arrays
      const cameras = extractDigifortData(camerasData, "Cameras");
      const camerasArray = Array.isArray(cameras) ? cameras : [];
      
      const statusCameras = extractDigifortData(statusData, "Cameras");
      const statusArray = Array.isArray(statusCameras) ? statusCameras : [];
      
      // Calculate stats
      const totalCameras = camerasArray.length;
      const activeCameras = camerasArray.filter(c => c.Active === true).length;
      const deactivatedCameras = camerasArray.filter(c => c.Active === false).length;
      const workingCameras = statusArray.filter(c => c.Working === true).length;
      const notWorkingCameras = statusArray.filter(c => c.Working === false).length;
      
      // Log the stats
      console.log(`[DIGIFORT] Dashboard Stats:`);
      console.log(`[DIGIFORT]   Total: ${totalCameras}`);
      console.log(`[DIGIFORT]   Activated: ${activeCameras}`);
      console.log(`[DIGIFORT]   Deactivated: ${deactivatedCameras}`);
      console.log(`[DIGIFORT]   Working: ${workingCameras}`);
      console.log(`[DIGIFORT]   Not Working: ${notWorkingCameras}`);
      
      // Return stats in dashboard format matching the schema
      res.json({
        totalCameras: totalCameras,
        activeCameras: activeCameras,
        recordingCameras: workingCameras, // Working cameras are considered recording
        offlineCameras: notWorkingCameras,
        totalEvents: 0, // TODO: Implement events counting
        criticalEvents: 0, // TODO: Implement critical events counting
        totalStorage: "N/A", // TODO: Implement storage stats
        usedStorage: "N/A", // TODO: Implement storage stats
      });
    } catch (error) {
      console.error(`[ROUTES] Error in /api/dashboard/stats:`, error instanceof Error ? error.message : error);
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/system/status
   * 
   * Get system status from Digifort Server API:
   * - Server information
   * - Server usage statistics
   * 
   * Proxies to /Interface/Server/GetInfo and /Interface/Server/GetUsage endpoints.
   */
  app.get("/api/system/status", async (req, res) => {
    try {
      // Fetch server info and usage
      const [serverInfo, serverUsage] = await Promise.all([
        proxyRequest("/Interface/Server/GetInfo").catch(() => ({})),
        proxyRequest("/Interface/Server/GetUsage").catch(() => ({})),
      ]);
      
      const info = extractDigifortData(serverInfo, "Info");
      const stats = extractDigifortData(serverUsage, "Stats");
      
      console.log(`[DIGIFORT] Server Info:`, info);
      console.log(`[DIGIFORT] Server Usage:`, stats);
      
      // Format uptime (UpTime is in seconds)
      const uptimeSeconds = info?.UpTime || 0;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const uptimeFormatted = `${days}d ${hours}h ${minutes}m`;
      
      // Calculate memory usage percentage
      const globalMemory = stats?.GlobalMemory || 1;
      const serverMemory = stats?.ServerMemory || 0;
      const memoryUsagePercent = Math.round((serverMemory / globalMemory) * 100);
      
      // Calculate CPU usage (Processor is 0-100)
      const cpuUsage = stats?.Processor || 0;
      
      // Format memory values to MB
      const serverMemoryMB = Math.round(serverMemory / (1024 * 1024));
      const globalMemoryMB = Math.round(globalMemory / (1024 * 1024));
      
      // Format traffic (assuming bytes/sec, convert to Kbits/s)
      const inputTrafficKbps = ((stats?.InputTraffic || 0) * 8 / 1000).toFixed(2);
      const outputTrafficKbps = ((stats?.OutputTraffic || 0) * 8 / 1000).toFixed(2);
      
      res.json({
        serverStatus: "online" as const,
        cpuUsage: cpuUsage,
        memoryUsage: memoryUsagePercent,
        diskUsage: 0, // TODO: Get disk usage from Digifort API
        uptime: uptimeFormatted,
        lastSync: "Just now",
        serverInfo: {
          edition: info?.Edition || "Unknown",
          version: info?.Version || "Unknown",
          platform: info?.Platform || "Unknown",
          serverType: info?.ServerType || "Unknown",
        },
        connections: stats?.Connections || 0,
        clients: stats?.Clients || 0,
        serverMemoryMB: serverMemoryMB,
        globalMemoryMB: globalMemoryMB,
        inputTraffic: inputTrafficKbps,
        outputTraffic: outputTrafficKbps,
      });
    } catch (error) {
      console.error(`[ROUTES] Error in /api/system/status:`, error instanceof Error ? error.message : error);
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/cameras
   * 
   * Get all cameras from Digifort API.
   * 
   * Proxies to /Interface/Cameras/GetCameras endpoint and transforms
   * the response from Digifort format (PascalCase) to frontend format (camelCase).
   * 
   * Returns: Array of camera objects with fields like name, active, model,
   * deviceType, connectionAddress, latitude, longitude, etc.
   */
  app.get("/api/cameras", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/GetCameras");
      // Mock server returns: { Cameras: [...] } directly
      // Digifort API returns: { Response: { Data: { Cameras: [...] } } }
      const cameras = extractDigifortData(data, "Cameras");
      const camerasArray = Array.isArray(cameras) ? cameras : [];
      
      // Log camera data from Digifort
      console.log(`[DIGIFORT] ✓ Received ${camerasArray.length} cameras from Digifort API`);
      if (camerasArray.length > 0) {
        console.log(`[DIGIFORT] Camera sample (first camera):`, {
          name: camerasArray[0]?.Name || camerasArray[0]?.name,
          active: camerasArray[0]?.Active || camerasArray[0]?.active,
          model: camerasArray[0]?.Model || camerasArray[0]?.model,
          connectionAddress: camerasArray[0]?.ConnectionAddress || camerasArray[0]?.connectionAddress,
        });
      }
      
      // Transform Digifort API format (Name, Active, Group) to frontend format (name, active, group)
      const transformedCameras = camerasArray.map(transformCamera).filter(Boolean);
      console.log(`[DIGIFORT] Transformed ${transformedCameras.length} cameras for frontend`);
      res.json(transformedCameras);
    } catch (error) {
      console.error(`[ROUTES] Error in /api/cameras:`, error instanceof Error ? error.message : error);
      console.error(`[ROUTES] Error stack:`, error instanceof Error ? error.stack : 'no stack');
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/cameras/groups
   * 
   * Get all camera groups from Digifort API.
   * 
   * Proxies to /Interface/Cameras/GetGroups endpoint and transforms
   * the response from Digifort format to frontend format.
   * 
   * Returns: Array of group objects with name, cameras array, and active status.
   */
  app.get("/api/cameras/groups", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/GetGroups");
      // Digifort API returns: { Response: { Data: { Groups: [...] } } }
      const groups = extractDigifortData(data, "Groups");
      const groupsArray = Array.isArray(groups) ? groups : [];
      // Transform Digifort API format to frontend format
      const transformedGroups = groupsArray.map(transformGroup).filter(Boolean);
      res.json(transformedGroups);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/cameras/:name/status
   * 
   * Get status of a specific camera by name.
   * 
   * Proxies to /Interface/Cameras/GetStatus endpoint with the camera name.
   * Returns: Single camera object with current status, or null if not found.
   */
  app.get("/api/cameras/:name/status", async (req, res) => {
    try {
      const data = await proxyRequest(`/Interface/Cameras/GetStatus?Cameras=${encodeURIComponent(req.params.name)}`);
      // Digifort API returns: { Response: { Data: { Cameras: [...] } } }
      const cameras = extractDigifortData(data, "Cameras");
      const camerasArray = Array.isArray(cameras) ? cameras : [];
      if (camerasArray.length > 0) {
        const transformed = transformCamera(camerasArray[0]);
        res.json(transformed);
      } else {
        res.json(null);
      }
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * POST /api/cameras/:name/activation
   * 
   * Activate or deactivate a camera.
   * 
   * Request body: { action: "activate" | "deactivate" }
   * Proxies to /Interface/Cameras/Activation endpoint.
   */
  app.post("/api/cameras/:name/activation", async (req, res) => {
    try {
      const { action } = req.body;
      const data = await proxyRequest("/Interface/Cameras/Activation", {
        method: "POST",
        body: JSON.stringify({ camera: req.params.name, action }),
      });
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/analytics/configurations
   * 
   * Get all analytics configurations (AI/ML analysis rules).
   * 
   * Returns: Array of configuration objects with name, camera, events, status, etc.
   */
  app.get("/api/analytics/status", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetStatus");
      const configs = extractDigifortData(data, "AnalyticsConfigurations");
      const arr = Array.isArray(configs) ? configs : [];
      console.log(`[DIGIFORT] Analytics status: ${arr.length} configs`);
      res.json({
        total: arr.length,
        active: arr.filter((c: any) => c.Active === true).length,
        working: arr.filter((c: any) => c.Working === true).length,
        configs: arr.map((c: any) => ({
          name: c.Name || c.name || "",
          active: c.Active ?? false,
          working: c.Working ?? false,
          camera: c.Camera || c.camera || "",
          status: c.StatusMessage || c.Status || "",
        })),
      });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  app.get("/api/analytics/configurations", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetAnalyticsConfigurations");
      const configs = extractDigifortData(data, "AnalyticsConfigurations");
      res.json(Array.isArray(configs) ? configs : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/analytics/counters
   * 
   * Get all analytics counters (people count, vehicle count, etc.).
   * 
   * Returns: Array of counter objects with id, name, value, lastReset, etc.
   */
  app.get("/api/analytics/counters", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetCounters");
      const counters = extractDigifortData(data, "Counters");
      res.json(Array.isArray(counters) ? counters : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * POST /api/analytics/counters/:id/reset
   * 
   * Reset a specific analytics counter to zero.
   * 
   * Request body: { counterId: string }
   */
  app.post("/api/analytics/counters/:id/reset", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/ResetCounter", {
        method: "POST",
        body: JSON.stringify({ counterId: req.params.id }),
      });
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/analytics/events
   * 
   * Search for analytics events with optional filters.
   * 
   * Query parameters:
   * - startDate: Filter events after this date
   * - endDate: Filter events before this date
   * - cameras: Comma-separated list of camera names
   * - eventTypes: Comma-separated list of event types
   * 
   * Returns: Array of event objects with camera, timestamp, eventType, etc.
   */
  app.get("/api/analytics/events", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.startDate) queryParams.set("StartDate", req.query.startDate as string);
      if (req.query.endDate) queryParams.set("EndDate", req.query.endDate as string);
      if (req.query.cameras) queryParams.set("Cameras", req.query.cameras as string);
      if (req.query.eventTypes) queryParams.set("EventTypes", req.query.eventTypes as string);
      
      const data = await proxyRequest(`/Interface/Analytics/Search?${queryParams.toString()}`);
      const events = extractAlerts(data);
      res.json(events);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/analytics/events/recent
   * 
   * Get the 10 most recent analytics events.
   * 
   * Returns: Array of the 10 most recent event objects.
   */
  app.get("/api/analytics/events/recent", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/Search");
      const eventsArray = extractAlerts(data);
      res.json(eventsArray.slice(0, 10));
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/analytics/chart
   * 
   * Get event data for analytics charts (last 24 hours).
   * 
   * Returns: Array of hourly event data for charting.
   */
  app.get("/api/analytics/chart", async (req, res) => {
    try {
      // Use mock server's Analytics/Chart endpoint
      const data = await proxyRequest("/Interface/Analytics/Chart");
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/alarms
   *
   * All alerts/alarms from mock Digifort Analytics/Search.
   * Query: region, site, alarmStatus (active|closed)
   */
  app.get("/api/alarms", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.region) queryParams.set("Region", req.query.region as string);
      if (req.query.site) queryParams.set("Site", req.query.site as string);
      if (req.query.alarmStatus) queryParams.set("AlarmStatus", (req.query.alarmStatus as string).toUpperCase());

      const endpoint = queryParams.toString()
        ? `/Interface/Analytics/Search?${queryParams.toString()}`
        : "/Interface/Analytics/Search";
      const data = await proxyRequest(endpoint);
      res.json(extractAlerts(data));
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/alarms/summary
   *
   * Regional active/closed alarm counts for pie charts (mock: /Interface/Alarms/GetSummary).
   */
  app.get("/api/alarms/summary", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Alarms/GetSummary").catch(async () => {
        const search = await proxyRequest("/Interface/Analytics/Search");
        return buildAlarmSummaryFromAlerts(extractAlerts(search));
      });
      if (data?.totals && data?.regions) {
        res.json(data);
        return;
      }
      res.json(transformAlarmSummary(data));
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/audit/logs
   * 
   * Search audit logs with optional filters.
   * 
   * Query parameters:
   * - startDate: Filter logs after this date
   * - endDate: Filter logs before this date
   * - category: Filter by category (USER_ACTION, SERVER_CONNECTION, etc.)
   * - keyword: Search in action and details fields
   * 
   * Returns: Array of audit log objects with timestamp, category, action, user, etc.
   */
  app.get("/api/audit/logs", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.startDate) queryParams.set("StartDate", req.query.startDate as string);
      if (req.query.endDate) queryParams.set("EndDate", req.query.endDate as string);
      if (req.query.category) queryParams.set("Category", req.query.category as string);
      if (req.query.keyword) queryParams.set("Keyword", req.query.keyword as string);
      
      const data = await proxyRequest(`/Interface/Audit/Search?${queryParams.toString()}`);
      const logs = extractDigifortData(data, "AuditLogs");
      res.json(Array.isArray(logs) ? logs : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/bookmarks
   * 
   * Search bookmarks with optional filters.
   * 
   * Query parameters:
   * - keyword: Search in title and remarks fields
   * - colors: Comma-separated list of colors to filter by
   * 
   * Returns: Array of bookmark objects.
   */
  app.get("/api/bookmarks", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.keyword) queryParams.set("Keyword", req.query.keyword as string);
      if (req.query.colors) queryParams.set("Colors", req.query.colors as string);
      
      const data = await proxyRequest(`/Interface/Cameras/Bookmarks/Search?${queryParams.toString()}`);
      const bookmarks = extractDigifortData(data, "Bookmarks");
      res.json(Array.isArray(bookmarks) ? bookmarks : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * POST /api/bookmarks
   * 
   * Create a new bookmark for video footage.
   * 
   * Request body: {
   *   title: string,
   *   color: string,
   *   startDate: string,
   *   startTime: string,
   *   endDate: string,
   *   endTime: string,
   *   cameras: string[],
   *   remarks: string
   * }
   */
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/Bookmarks/Add", {
        method: "POST",
        body: JSON.stringify(req.body),
      });
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * DELETE /api/bookmarks/:id
   * 
   * Delete a bookmark by ID.
   * 
   * Proxies to /Interface/Cameras/Bookmarks/Delete endpoint.
   */
  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const data = await proxyRequest(`/Interface/Cameras/Bookmarks/Delete?id=${req.params.id}`, {
        method: "DELETE",
      });
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // IO DEVICES
  // ============================================================
  app.get("/api/io-devices", async (req, res) => {
    try {
      const [devicesData, statusData] = await Promise.all([
        proxyRequest("/Interface/IODevices/GetIODevices").catch(() => ({})),
        proxyRequest("/Interface/IODevices/GetStatus").catch(() => ({})),
      ]);
      const devices = extractDigifortData(devicesData, "IODevices") || [];
      const statuses = extractDigifortData(statusData, "IODevices") || [];
      const devicesArr = Array.isArray(devices) ? devices : [];
      const statusArr = Array.isArray(statuses) ? statuses : [];
      console.log(`[DIGIFORT] IO Devices: ${devicesArr.length} total`);
      res.json({
        total: devicesArr.length,
        active: devicesArr.filter((d: any) => d.Active === true).length,
        working: statusArr.filter((d: any) => d.Working === true).length,
        notWorking: statusArr.filter((d: any) => d.Working === false).length,
        devices: devicesArr.map((d: any) => ({
          name: d.Name || d.name || "",
          active: d.Active ?? false,
          model: d.Model || d.model || "",
          connectionAddress: d.ConnectionAddress || d.connectionAddress || "",
        })),
      });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // USERS & CONNECTIONS
  // ============================================================
  app.get("/api/users/connections", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Users/GetConnections").catch(() => ({}));
      const connections = extractDigifortData(data, "Connections") || extractDigifortData(data, "Users") || [];
      const arr = Array.isArray(connections) ? connections : [];
      console.log(`[DIGIFORT] Active connections: ${arr.length}`);
      res.json({ total: arr.length, connections: arr });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // SERVER LICENSES
  // ============================================================
  app.get("/api/server/licenses", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Server/GetLicenses").catch(() => ({}));
      const licenses = extractDigifortData(data, "Licenses") || {};
      console.log(`[DIGIFORT] Licenses:`, licenses);
      res.json(licenses);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // SERVER MASTER/SLAVE STATUS
  // ============================================================
  app.get("/api/server/master-slave", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Server/GetMasterSlaveStatus").catch(() => ({}));
      const raw = data?.Response?.Data || data || {};
      // Flatten: convert nested arrays/objects to counts/strings
      const flatten = (obj: any): Record<string, string> => {
        const result: Record<string, string> = {};
        for (const [k, v] of Object.entries(obj)) {
          if (Array.isArray(v)) result[k] = `${v.length} item(s)`;
          else if (typeof v === "object" && v !== null) result[k] = JSON.stringify(v).substring(0, 60);
          else result[k] = String(v ?? "—");
        }
        return result;
      };
      const flat = flatten(raw);
      console.log(`[DIGIFORT] Master/Slave:`, flat);
      res.json(flat);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // LPR STATUS
  // ============================================================
  app.get("/api/lpr/status", async (req, res) => {
    try {
      const [configsData, statusData] = await Promise.all([
        proxyRequest("/Interface/LPR/GetLPRConfigurations").catch(() => ({})),
        proxyRequest("/Interface/LPR/GetStatus").catch(() => ({})),
      ]);
      const configs = extractDigifortData(configsData, "LPRConfigurations") || [];
      const statuses = extractDigifortData(statusData, "LPRConfigurations") || [];
      const configsArr = Array.isArray(configs) ? configs : [];
      const statusArr = Array.isArray(statuses) ? statuses : [];
      console.log(`[DIGIFORT] LPR configs: ${configsArr.length}`);
      res.json({
        total: configsArr.length,
        active: configsArr.filter((c: any) => c.Active === true).length,
        working: statusArr.filter((c: any) => c.Working === true).length,
        configs: configsArr.map((c: any) => ({
          name: c.Name || c.name || "",
          active: c.Active ?? false,
          camera: c.Camera || c.camera || "",
        })),
      });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // RTSP STATUS
  // ============================================================
  app.get("/api/rtsp/status", async (req, res) => {
    try {
      const [configData, statusData] = await Promise.all([
        proxyRequest("/Interface/RTSP/GetConfig").catch(() => ({})),
        proxyRequest("/Interface/RTSP/GetStatus").catch(() => ({})),
      ]);
      const config = extractDigifortData(configData, "Config") || configData?.Response?.Data || {};
      const status = extractDigifortData(statusData, "Status") || statusData?.Response?.Data || {};
      console.log(`[DIGIFORT] RTSP Config:`, config);
      console.log(`[DIGIFORT] RTSP Status:`, status);
      res.json({ config, status });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // FAILOVER STATUS
  // ============================================================
  app.get("/api/failover/status", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Failover/GetStatus").catch(() => ({}));
      const raw = extractDigifortData(data, "FailoverMonitors") || 
                  extractDigifortData(data, "Failover") || 
                  data?.Response?.Data || {};
      // If it's an array (list of failover monitors), summarise it
      if (Array.isArray(raw)) {
        res.json({
          total: raw.length,
          active: raw.filter((f: any) => f.Active === true).length,
          working: raw.filter((f: any) => f.Working === true).length,
          monitors: raw.map((f: any) => ({
            name: f.Name || f.name || "Unknown",
            active: f.Active ?? false,
            working: f.Working ?? false,
            status: f.StatusMessage || f.Status || "",
          })),
        });
      } else {
        res.json(raw);
      }
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // GLOBAL EVENTS
  // ============================================================
  app.get("/api/events/global", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/GlobalEvents/GetGlobalEvents").catch(() => ({}));
      const events = extractDigifortData(data, "GlobalEvents") || [];
      const arr = Array.isArray(events) ? events : [];
      console.log(`[DIGIFORT] Global events: ${arr.length}`);
      res.json({ total: arr.length, events: arr });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // SCHEDULED EVENTS
  // ============================================================
  app.get("/api/events/scheduled", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/ScheduledEvents/GetScheduledEvents").catch(() => ({}));
      const events = extractDigifortData(data, "ScheduledEvents") || [];
      const arr = Array.isArray(events) ? events : [];
      console.log(`[DIGIFORT] Scheduled events: ${arr.length}`);
      res.json({ total: arr.length, events: arr });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // CAMERA GROUPS (enhanced)
  // ============================================================
  app.get("/api/cameras/groups/summary", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/GetGroups").catch(() => ({}));
      const groups = extractDigifortData(data, "Groups") || [];
      const arr = Array.isArray(groups) ? groups : [];
      console.log(`[DIGIFORT] Camera groups: ${arr.length}`);
      res.json({ total: arr.length, groups: arr.map((g: any) => ({ name: g.Name || g.name || "" })) });
    } catch (error) {
      upstreamError(res, error);
    }
  });

  // ============================================================
  // SMART CONNECT — Event receiver + SSE stream
  // ============================================================

  // POST  /api/smart-connect/events
  // Accepts a single DigifortSmartConnectEvent and pushes it to all SSE clients
  app.post("/api/smart-connect/events", (req: ExpressRequest, res: ExpressResponse) => {
    const { valid, errors, event } = validateSmartConnectEvent(req.body);
    if (!valid || !event) {
      res.status(400).json({ ok: false, errors });
      return;
    }
    smartConnectEvents.unshift(event);
    if (smartConnectEvents.length > MAX_STORED_EVENTS) smartConnectEvents.length = MAX_STORED_EVENTS;
    broadcastSmartConnectEvent(event);
    console.log(`[SMART-CONNECT] Received event: ${event.eventId} — ${event.eventName} from ${event.sourceName}`);
    res.json({ ok: true, eventId: event.eventId });
  });

  // POST  /api/smart-connect/events/batch
  // Accepts an array of DigifortSmartConnectEvent objects
  app.post("/api/smart-connect/events/batch", (req: ExpressRequest, res: ExpressResponse) => {
    const body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ ok: false, errors: ["Body must be a JSON array"] });
      return;
    }
    const results: Array<{ eventId?: string; ok: boolean; errors?: string[] }> = [];
    for (const item of body) {
      const { valid, errors, event } = validateSmartConnectEvent(item);
      if (valid && event) {
        smartConnectEvents.unshift(event);
        broadcastSmartConnectEvent(event);
        results.push({ eventId: event.eventId, ok: true });
      } else {
        results.push({ ok: false, errors });
      }
    }
    if (smartConnectEvents.length > MAX_STORED_EVENTS) smartConnectEvents.length = MAX_STORED_EVENTS;
    console.log(`[SMART-CONNECT] Batch received: ${results.filter(r => r.ok).length}/${body.length} valid events`);
    res.json({ ok: true, results });
  });

  // GET   /api/smart-connect/events
  // Returns all stored events (newest first), optional ?limit=N
  app.get("/api/smart-connect/events", (req: ExpressRequest, res: ExpressResponse) => {
    const limit = parseInt(req.query.limit as string) || 200;
    res.json(smartConnectEvents.slice(0, limit));
  });

  // DELETE /api/smart-connect/events
  // Clears all stored events
  app.delete("/api/smart-connect/events", (_req: ExpressRequest, res: ExpressResponse) => {
    smartConnectEvents.length = 0;
    console.log("[SMART-CONNECT] Event store cleared");
    res.json({ ok: true });
  });

  // GET   /api/smart-connect/events/stream
  // Server-Sent Events stream — pushes new events in real time
  app.get("/api/smart-connect/events/stream", (req: ExpressRequest, res: ExpressResponse) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send existing events on connect so the client can hydrate immediately
    for (const event of [...smartConnectEvents].reverse()) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    // Keep-alive ping every 30 s
    const pingInterval = setInterval(() => {
      try { res.write(": ping\n\n"); } catch { /* disconnected */ }
    }, 30_000);

    smartConnectClients.push(res);
    console.log(`[SMART-CONNECT] SSE client connected (total: ${smartConnectClients.length})`);

    req.on("close", () => {
      clearInterval(pingInterval);
      const idx = smartConnectClients.indexOf(res);
      if (idx !== -1) smartConnectClients.splice(idx, 1);
      console.log(`[SMART-CONNECT] SSE client disconnected (total: ${smartConnectClients.length})`);
    });
  });

  return httpServer;
}
