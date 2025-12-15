import type { Express, Response as ExpressResponse } from "express";
import { type Server } from "http";
import { addAuthToUrl, getBasicAuthHeader } from "./auth";

const MOCK_SERVER_URL = process.env.DIGIFORT_API_URL || "http://192.168.100.164:8601";

// Debug counters
let proxyRequestLogCount = 0;
let proxyRequestFirstFailure = false;

function upstreamError(res: ExpressResponse, _error: unknown) {
  res.status(502).json({ message: "Upstream API unavailable" });
}

/**
 * Parse Digifort API response (handles both JSON and XML)
 */
async function parseDigifortResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("application/json") || contentType.includes("text/json")) {
    return await response.json();
  } else {
    // Try to parse as JSON first (might be JSON without proper content-type)
    const text = await response.text();
    
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
 * Digifort API uses capitalized fields (Name, Active, Group) -> frontend expects lowercase (name, active, group)
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
 * Handles: { Response: { Data: { ... } } } or direct data
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

async function proxyRequest(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  try {
    // Add ResponseFormat=JSON to request JSON format explicitly
    const separator = endpoint.includes("?") ? "&" : "?";
    const endpointWithFormat = `${endpoint}${separator}ResponseFormat=JSON`;
    
    // Add authentication parameters to the endpoint URL (for Safe auth) or prepare Basic auth header
    const authenticatedUrl = await addAuthToUrl(`${MOCK_SERVER_URL}${endpointWithFormat}`);
    const basicAuthHeader = getBasicAuthHeader();
    
    // Prepare headers
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers as Record<string, string>,
    };
    
    // Add Basic HTTP Authentication header if using Basic auth
    if (basicAuthHeader) {
      headers["Authorization"] = basicAuthHeader;
    }
    
    // Debug: Log URL for first few requests (mask sensitive data)
    if (proxyRequestLogCount < 3) {
      const maskedUrl = authenticatedUrl.replace(/AuthData=[A-F0-9]+/i, 'AuthData=***');
      console.log(`[PROXY] Request URL: ${maskedUrl}`);
      console.log(`[PROXY] Auth Method: ${process.env.DIGIFORT_AUTH_METHOD || "basic"}`);
      if (basicAuthHeader) {
        const maskedAuth = basicAuthHeader.substring(0, 15) + "***";
        console.log(`[PROXY] Authorization Header: ${maskedAuth}`);
        console.log(`[PROXY] Using Basic HTTP Authentication`);
      } else {
        console.log(`[PROXY] ⚠️  No Authorization header!`);
      }
      proxyRequestLogCount++;
    }
    
    const response = await fetch(authenticatedUrl, {
      ...options,
      headers,
    });
    
    // Parse response to check for authentication errors in response body
    const responseData = await parseDigifortResponse(response);
    
    // Check for authentication error (Code 101) in response body
    // Digifort returns HTTP 200 but with Code 101 in response body for auth errors
    if (responseData.Response?.Code === 101 || responseData.Code === 101) {
      if (retryCount === 0 && process.env.DIGIFORT_AUTH_METHOD !== "basic") {
        // Only retry with Safe auth (Basic auth doesn't use sessions)
        // Log the actual URL being used for debugging (first failure only)
        if (!proxyRequestFirstFailure) {
          const maskedUrl = authenticatedUrl.replace(/AuthData=[A-F0-9]+/i, 'AuthData=***');
          console.log(`[PROXY] Authentication error (Code 101) for ${endpoint}`);
          console.log(`[PROXY] Request URL: ${maskedUrl}`);
          console.log(`[PROXY] Response:`, JSON.stringify(responseData, null, 2));
          proxyRequestFirstFailure = true;
        }
        
        console.log(`[PROXY] Clearing session and retrying ${endpoint}...`);
        const { clearAuthSession } = await import("./auth");
        await clearAuthSession(); // Wait for session clearing to complete
        // Small delay to ensure new session is ready
        await new Promise(resolve => setTimeout(resolve, 200));
        // Retry once with new session
        return await proxyRequest(endpoint, options, retryCount + 1);
      } else {
        // Already retried or using Basic auth, return the error response
        console.error(`[PROXY] Authentication failed for ${endpoint}. This may indicate insufficient permissions or incorrect credentials.`);
        console.error(`[PROXY] Response:`, JSON.stringify(responseData, null, 2));
        return responseData;
      }
    }
    
    // Check HTTP status codes
    if (response.status === 401 || response.status === 403) {
      const errorText = await response.text();
      
      // Handle 401 Unauthorized specifically with detailed logging
      if (response.status === 401) {
        console.error(`[PROXY] 401 Unauthorized for ${endpoint}`);
        console.error(`[PROXY] Response: ${errorText.substring(0, 500)}`);
        
        if (basicAuthHeader) {
          const username = process.env.DIGIFORT_USERNAME || "NOT SET";
          const password = process.env.DIGIFORT_PASSWORD || "";
          const testHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
          console.error(`[PROXY] ⚠️  Basic auth header was sent but rejected by server.`);
          console.error(`[PROXY]    Username: "${username}"`);
          console.error(`[PROXY]    Password: ${password ? "***SET***" : "(empty - no password)"}`);
          console.error(`[PROXY]    Auth Header: ${testHeader.substring(0, 20)}...`);
          console.error(`[PROXY]    Verify credentials are correct for Digifort server at ${MOCK_SERVER_URL}`);
        } else {
          console.error(`[PROXY] ⚠️  No Authorization header was sent!`);
          console.error(`[PROXY]    Set DIGIFORT_USERNAME environment variable`);
        }
        
        throw new Error(`Authentication failed: 401 Unauthorized. Check credentials.`);
      }
      
      if (retryCount === 0 && process.env.DIGIFORT_AUTH_METHOD !== "basic") {
        // Only retry with Safe auth (Basic auth failures are usually credential issues)
        console.log(`[PROXY] Authentication failed (${response.status}) for ${endpoint}, clearing session and retrying...`);
        const { clearAuthSession } = await import("./auth");
        await clearAuthSession(); // Wait for session clearing to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        return await proxyRequest(endpoint, options, retryCount + 1);
      } else {
        console.error(`[PROXY] Authentication failed for ${endpoint}: ${response.status} - ${errorText.substring(0, 200)}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      
      console.error(`[PROXY] Request failed for ${endpoint}: ${response.status} - ${errorText.substring(0, 200)}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`[PROXY] Error in proxyRequest for ${endpoint}:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Fetch cameras to calculate stats
      const camerasData = await proxyRequest("/Interface/Cameras/GetCameras");
      const cameras = extractDigifortData(camerasData, "Cameras");
      const camerasArray = Array.isArray(cameras) ? cameras : [];
      
      // Calculate stats from camera data
      const totalCameras = camerasArray.length;
      const activeCameras = camerasArray.filter(c => c.Active === true).length;
      const recordingCameras = camerasArray.filter(c => 
        c.MediaProfiles && c.MediaProfiles.includes("Recording")
      ).length;
      const offlineCameras = camerasArray.filter(c => c.Active === false).length;
      
      // Try to get system info for storage data (optional)
      let totalStorage = "N/A";
      let usedStorage = "N/A";
      let criticalEvents = 0;
      let totalEvents = 0;
      
      try {
        const systemData = await proxyRequest("/Interface/Server/GetInfo");
        const serverInfo = extractDigifortData(systemData, "ServerInfo");
        if (serverInfo?.TotalStorage) {
          totalStorage = serverInfo.TotalStorage;
        }
        if (serverInfo?.UsedStorage) {
          usedStorage = serverInfo.UsedStorage;
        }
      } catch (err) {
        // Storage data is optional, continue without it
        console.log("[STATS] Could not fetch storage info:", err instanceof Error ? err.message : err);
      }
      
      // Try to get events count (optional)
      try {
        const eventsData = await proxyRequest("/Interface/Analytics/Search?");
        const events = extractDigifortData(eventsData, "Events");
        if (Array.isArray(events)) {
          totalEvents = events.length;
          criticalEvents = events.filter((e: any) => e.Severity === "Critical" || e.Priority === "High").length;
        }
      } catch (err) {
        // Events data is optional, continue without it
        console.log("[STATS] Could not fetch events info:", err instanceof Error ? err.message : err);
      }
      
      const stats = {
        totalCameras,
        activeCameras,
        recordingCameras,
        offlineCameras,
        totalEvents,
        criticalEvents,
        totalStorage,
        usedStorage,
      };
      
      res.json(stats);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  app.get("/api/system/status", async (req, res) => {
    try {
      // Use Server/GetInfo for system information
      const data = await proxyRequest("/Interface/Server/GetInfo");
      
      // Check for authentication error
      if (data.Response?.Code === 101 || data.Code === 101) {
        res.status(401).json({ message: "Authentication error", code: 101 });
        return;
      }
      
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  app.get("/api/cameras", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Cameras/GetCameras");
      // Digifort API returns: { Response: { Data: { Cameras: [...] } } }
      const cameras = extractDigifortData(data, "Cameras");
      const camerasArray = Array.isArray(cameras) ? cameras : [];
      // Transform Digifort API format (Name, Active, Group) to frontend format (name, active, group)
      const transformedCameras = camerasArray.map(transformCamera).filter(Boolean);
      res.json(transformedCameras);
    } catch (error) {
      upstreamError(res, error);
    }
  });

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

  app.get("/api/analytics/configurations", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetAnalyticsConfigurations");
      const configs = extractDigifortData(data, "AnalyticsConfigurations");
      res.json(Array.isArray(configs) ? configs : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  app.get("/api/analytics/counters", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/GetCounters");
      const counters = extractDigifortData(data, "Counters");
      res.json(Array.isArray(counters) ? counters : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

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

  app.get("/api/analytics/events", async (req, res) => {
    try {
      const queryParams = new URLSearchParams();
      if (req.query.startDate) queryParams.set("StartDate", req.query.startDate as string);
      if (req.query.endDate) queryParams.set("EndDate", req.query.endDate as string);
      if (req.query.cameras) queryParams.set("Cameras", req.query.cameras as string);
      if (req.query.eventTypes) queryParams.set("EventTypes", req.query.eventTypes as string);
      
      const data = await proxyRequest(`/Interface/Analytics/Search?${queryParams.toString()}`);
      const events = extractDigifortData(data, "Events");
      res.json(Array.isArray(events) ? events : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  app.get("/api/analytics/events/recent", async (req, res) => {
    try {
      const data = await proxyRequest("/Interface/Analytics/Search");
      const events = extractDigifortData(data, "Events");
      const eventsArray = Array.isArray(events) ? events : [];
      res.json(eventsArray.slice(0, 10));
    } catch (error) {
      upstreamError(res, error);
    }
  });

  app.get("/api/analytics/chart", async (req, res) => {
    try {
      // Analytics chart data comes from Analytics/Search endpoint
      // Return empty data or use Search with date range
      const queryParams = new URLSearchParams();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      
      queryParams.set("StartDate", startDate.toISOString().split('T')[0].replace(/-/g, '.'));
      queryParams.set("EndDate", endDate.toISOString().split('T')[0].replace(/-/g, '.'));
      
      const data = await proxyRequest(`/Interface/Analytics/Search?${queryParams.toString()}`);
      const events = extractDigifortData(data, "Events");
      res.json(Array.isArray(events) ? events : []);
    } catch (error) {
      upstreamError(res, error);
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
      const logs = extractDigifortData(data, "AuditLogs");
      res.json(Array.isArray(logs) ? logs : []);
    } catch (error) {
      upstreamError(res, error);
    }
  });

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

  return httpServer;
}
