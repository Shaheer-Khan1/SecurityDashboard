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

import type { Express, Response as ExpressResponse } from "express";
import { type Server } from "http";
import { addAuthToUrl, getBasicAuthHeader } from "./auth";

// Digifort API base URL (or mock server URL for development)
// ============================================
// DIGIFORT API CONFIGURATION (COMMENTED OUT)
// ============================================
// To use the Digifort API instead of the mock server:
// 1. Uncomment the line below
// 2. Comment out the MOCK_SERVER_URL line that follows
// 3. Set environment variables: DIGIFORT_USERNAME, DIGIFORT_PASSWORD, DIGIFORT_API_URL
// const DIGIFORT_API_URL = process.env.DIGIFORT_API_URL || "http://192.168.100.164:8601";

// ============================================
// MOCK SERVER CONFIGURATION (ACTIVE)
// ============================================
// Using mock server for development and testing
// The mock server provides sample data for all features
const MOCK_SERVER_URL = process.env.MOCK_SERVER_URL || "http://localhost:8089";

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
    // MOCK SERVER MODE (ACTIVE)
    // ============================================
    // Simple direct request to mock server - no authentication required
    const fullUrl = `${MOCK_SERVER_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...options.headers as Record<string, string>,
    };
    
    if (proxyRequestLogCount < 3) {
      console.log(`[PROXY] Mock Server Request: ${fullUrl}`);
      console.log(`[PROXY] MOCK_SERVER_URL env: ${process.env.MOCK_SERVER_URL || 'not set (using default)'}`);
      proxyRequestLogCount++;
    }
    
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PROXY] Mock server request failed for ${endpoint}: ${response.status} - ${errorText.substring(0, 200)}`);
        throw new Error(`Mock server request failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (proxyRequestLogCount < 3) {
        console.log(`[PROXY] Successfully received response from mock server for ${endpoint}`);
      }
      
      return responseData;
    } catch (fetchError) {
      console.error(`[PROXY] Fetch error for ${endpoint}:`, fetchError instanceof Error ? fetchError.message : fetchError);
      console.error(`[PROXY] Attempted URL: ${fullUrl}`);
      throw fetchError;
    }
    
    // ============================================
    // DIGIFORT API MODE (COMMENTED OUT)
    // ============================================
    // To use Digifort API instead of mock server, uncomment below and comment above
    /*
    // Add ResponseFormat=JSON to request JSON format explicitly
    const separator = endpoint.includes("?") ? "&" : "?";
    const endpointWithFormat = `${endpoint}${separator}ResponseFormat=JSON`;
    
    // Import auth functions
    const { addAuthToUrl, getBasicAuthHeader } = await import("./auth");
    
    // Add authentication parameters to the endpoint URL (for Safe auth) or prepare Basic auth header
    const authenticatedUrl = await addAuthToUrl(`${DIGIFORT_API_URL}${endpointWithFormat}`);
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
    
    // Check HTTP status codes
    if (response.status === 401 || response.status === 403) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        console.error(`[PROXY] 401 Unauthorized for ${endpoint}`);
        if (basicAuthHeader) {
          console.error(`[PROXY] ⚠️  Basic auth header was sent but rejected by server.`);
          console.error(`[PROXY]    Verify credentials are correct for Digifort server`);
        } else {
          console.error(`[PROXY] ⚠️  No Authorization header was sent!`);
        }
        throw new Error(`Authentication failed: 401 Unauthorized`);
      }
      
      if (retryCount === 0 && process.env.DIGIFORT_AUTH_METHOD !== "basic") {
        console.log(`[PROXY] Authentication failed (${response.status}) for ${endpoint}, retrying...`);
        const { clearAuthSession } = await import("./auth");
        await clearAuthSession();
        await new Promise(resolve => setTimeout(resolve, 200));
        return await proxyRequest(endpoint, options, retryCount + 1);
      } else {
        console.error(`[PROXY] Authentication failed for ${endpoint}: ${response.status}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Request failed for ${endpoint}: ${response.status}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return responseData;
    */
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
   * Get dashboard statistics including:
   * - Total cameras, active cameras, recording cameras, offline cameras
   * - Total events and critical events count
   * - Storage information (total and used)
   * 
   * This endpoint aggregates data from multiple Digifort API endpoints
   * to provide a comprehensive dashboard overview.
   */
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Use mock server's Dashboard/Stats endpoint directly
      const data = await proxyRequest("/Interface/Dashboard/Stats");
      res.json(data);
    } catch (error) {
      upstreamError(res, error);
    }
  });

  /**
   * GET /api/system/status
   * 
   * Get system status from Mock Server:
   * - Server status (online/offline)
   * - CPU usage
   * - Memory usage
   * - Disk usage
   * - Uptime
   * - Last sync timestamp
   * 
   * Proxies to /Interface/System/Status endpoint.
   */
  app.get("/api/system/status", async (req, res) => {
    try {
      // Use mock server's System/Status endpoint
      const data = await proxyRequest("/Interface/System/Status");
      res.json(data);
    } catch (error) {
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
      // Transform Digifort API format (Name, Active, Group) to frontend format (name, active, group)
      const transformedCameras = camerasArray.map(transformCamera).filter(Boolean);
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
      const events = extractDigifortData(data, "Events");
      res.json(Array.isArray(events) ? events : []);
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
      const events = extractDigifortData(data, "Events");
      const eventsArray = Array.isArray(events) ? events : [];
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

  return httpServer;
}
