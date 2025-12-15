import { createHash } from "crypto";

const DIGIFORT_API_URL = process.env.DIGIFORT_API_URL || "http://192.168.100.164:8601";
const DIGIFORT_USERNAME = process.env.DIGIFORT_USERNAME || "";
const DIGIFORT_PASSWORD = process.env.DIGIFORT_PASSWORD || "";
const AUTH_METHOD = process.env.DIGIFORT_AUTH_METHOD || "basic"; // "basic" or "safe"

interface AuthSession {
  sessionId: number;
  nonce: string;
  lastActivity: number;
}

let currentAuthSession: AuthSession | null = null;
const SESSION_TIMEOUT = 60 * 1000; // 60 seconds of inactivity (as per Digifort docs)
let keepAliveInterval: NodeJS.Timeout | null = null;
let sessionCreationPromise: Promise<AuthSession> | null = null; // Prevent concurrent session creation
let sessionClearingPromise: Promise<void> | null = null; // Prevent concurrent session clearing
let getAuthParamsLogCount = 0; // Debug counter
let basicAuthHeaderLogged = false; // Debug flag for Basic auth header logging

/**
 * Calculate MD5 hash for authentication data
 * Formula: UpperCase(MD5Hash(NOnce + ":" + UpperCase(Username) + ":" + UpperCase(MD5Hash(Password))))
 * Example: MD5(NONCE + ":" + "ADMIN" + ":" + UPPERCASE(MD5("pass")))
 */
function calculateAuthData(username: string, password: string, nonce: string): string {
  // Step 1: Calculate MD5 hash of password and convert to uppercase
  const passwordHash = createHash("md5").update(password).digest("hex").toUpperCase();
  
  // Step 2: Build the auth string: NONCE + ":" + UPPERCASE(USERNAME) + ":" + UPPERCASE(MD5(PASSWORD))
  // Note: NONCE should be used as-is (already uppercase hex from server)
  const usernameUpper = username.toUpperCase();
  const authString = `${nonce}:${usernameUpper}:${passwordHash}`;
  
  // Step 3: Calculate MD5 hash of the auth string and convert to uppercase
  const authData = createHash("md5").update(authString).digest("hex").toUpperCase();
  
  // Verify calculation with example from docs (admin/pass with nonce 68F1EE37050F456851DC90D62791839E)
  // Expected: AF63604073043A3C47FB5A506D8A8EFD
  if (username.toLowerCase() === "admin" && password === "pass" && nonce === "68F1EE37050F456851DC90D62791839E") {
    const expected = "AF63604073043A3C47FB5A506D8A8EFD";
    if (authData !== expected) {
      console.error(`[AUTH] ⚠️ AuthData calculation mismatch! Expected: ${expected}, Got: ${authData}`);
    } else {
      console.log(`[AUTH] ✓ AuthData calculation verified with example`);
    }
  }
  
  // Debug: Log calculation details for first few requests
  if (getAuthParamsLogCount < 3) {
    console.log(`[AUTH] AuthData calculation details:`, {
      nonce: nonce,
      username: usernameUpper,
      passwordHash: passwordHash,
      authString: authString,
      authData: authData,
    });
  }
  
  return authData;
}

/**
 * Parse XML response from Digifort API
 */
function parseXMLResponse(xmlText: string): { sessionId: number; nonce: string } {
  // Simple XML parsing for Digifort response format
  // Example: <Response><Data><Session><ID>32</ID><NOnce>164EF22C...</NOnce></Session></Data></Response>
  const idMatch = xmlText.match(/<ID>(\d+)<\/ID>/i);
  const nonceMatch = xmlText.match(/<NOnce>([A-F0-9]+)<\/NOnce>/i) || xmlText.match(/<Nonce>([A-F0-9]+)<\/Nonce>/i);
  
  if (!idMatch || !nonceMatch) {
    throw new Error(`Could not parse XML response. ID: ${idMatch ? 'found' : 'missing'}, NONCE: ${nonceMatch ? 'found' : 'missing'}`);
  }
  
  return {
    sessionId: parseInt(idMatch[1], 10),
    nonce: nonceMatch[1],
  };
}

/**
 * Create a new authentication session with Digifort API
 * Response format: { "Response": { "Code": 0, "Message": "OK", "Data": { "Session": { "ID": 32, "NOnce": "..." } } } }
 * Or XML: <Response><Data><Session><ID>32</ID><NOnce>...</NOnce></Session></Data></Response>
 */
async function createAuthSession(): Promise<AuthSession> {
  try {
    console.log(`[AUTH] Creating authentication session with ${DIGIFORT_API_URL}...`);
    console.log(`[AUTH] Username: ${DIGIFORT_USERNAME ? DIGIFORT_USERNAME.substring(0, 3) + "***" : "NOT SET"}`);
    
    // Request JSON format explicitly, fallback to XML if needed
    const createSessionUrl = `${DIGIFORT_API_URL}/Interface/CreateAuthSession?Format=JSON`;
    
    const response = await fetch(createSessionUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AUTH] Failed to create auth session: ${response.status} ${response.statusText}`);
      console.error(`[AUTH] Error response: ${errorText.substring(0, 500)}`);
      throw new Error(`Failed to create auth session: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    let data: any;
    let sessionId: number | undefined;
    let nonce: string | undefined;

    if (contentType.includes("application/json") || contentType.includes("text/json")) {
      // JSON response
      data = await response.json();
      console.log(`[AUTH] CreateAuthSession response (JSON):`, JSON.stringify(data, null, 2));
    } else {
      // XML or other format
      const responseText = await response.text();
      console.log(`[AUTH] CreateAuthSession response (${contentType}):`, responseText.substring(0, 500));
      
      if (responseText.trim().startsWith("<?xml") || responseText.trim().startsWith("<Response")) {
        // Parse XML
        const parsed = parseXMLResponse(responseText);
        sessionId = parsed.sessionId;
        nonce = parsed.nonce;
      } else {
        // Try to parse as JSON anyway (might be JSON without proper content-type)
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`Unsupported response format. Content-Type: ${contentType}, Response: ${responseText.substring(0, 200)}`);
        }
      }
    }

    // Parse JSON response if we got JSON (and didn't already parse XML)
    if (data && !sessionId) {
      // Parse response according to Digifort API format
      // JSON: { "Response": { "Code": 0, "Message": "OK", "Data": { "Session": { "ID": 32, "NOnce": "..." } } } }
      if (data.Response?.Data?.Session) {
        // Standard JSON format
        sessionId = data.Response.Data.Session.ID;
        nonce = data.Response.Data.Session.NOnce || data.Response.Data.Session.Nonce;
      } else if (data.ID && (data.NOnce || data.Nonce)) {
        // Alternative format
        sessionId = data.ID;
        nonce = data.NOnce || data.Nonce;
      } else if (data.Session) {
        // Another alternative
        sessionId = data.Session.ID;
        nonce = data.Session.NOnce || data.Session.Nonce;
      } else {
        throw new Error(`Invalid response format from CreateAuthSession: ${JSON.stringify(data)}`);
      }
    }

    if (!sessionId || !nonce) {
      throw new Error(`Missing session ID or NONCE in response. SessionId: ${sessionId || 'missing'}, Nonce: ${nonce ? 'present' : 'missing'}`);
    }

    const authSession: AuthSession = {
      sessionId,
      nonce,
      lastActivity: Date.now(),
    };

    console.log(`[AUTH] ✓ Authentication session created successfully!`);
    console.log(`[AUTH]   Session ID: ${sessionId}`);
    console.log(`[AUTH]   NONCE: ${nonce}`);
    console.log(`[AUTH]   Session will expire after 60 seconds of inactivity`);

    // Start keep-alive interval
    startKeepAlive();

    return authSession;
  } catch (error) {
    console.error(`[AUTH] ✗ Error creating auth session:`, error);
    throw error;
  }
}

/**
 * Update session activity timestamp
 */
function updateSessionActivity(): void {
  if (currentAuthSession) {
    currentAuthSession.lastActivity = Date.now();
  }
}

/**
 * Keep authentication session alive by calling UpdateAuthSession
 */
async function keepSessionAlive(): Promise<void> {
  if (!currentAuthSession) return;

  try {
    // Calculate AuthData directly without calling getAuthParams (to avoid circular dependency)
    const authData = calculateAuthData(DIGIFORT_USERNAME, DIGIFORT_PASSWORD, currentAuthSession.nonce);
    const updateUrl = `${DIGIFORT_API_URL}/Interface/UpdateAuthSession?AuthSession=${currentAuthSession.sessionId}&AuthData=${authData}`;
    
    await fetch(updateUrl, { method: "GET" });
    updateSessionActivity();
    console.log(`[AUTH] Session keep-alive: Session ${currentAuthSession.sessionId} refreshed`);
  } catch (error) {
    console.error(`[AUTH] Failed to keep session alive:`, error);
    // Clear session on error - will be recreated on next request
    currentAuthSession = null;
  }
}

/**
 * Start keep-alive interval (call UpdateAuthSession every 50 seconds)
 */
function startKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  // Call UpdateAuthSession every 50 seconds to keep session alive (session expires after 60s)
  keepAliveInterval = setInterval(() => {
    keepSessionAlive().catch(console.error);
  }, 50 * 1000);
  
  console.log(`[AUTH] Keep-alive interval started (every 50 seconds)`);
}

/**
 * Stop keep-alive interval
 */
function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

/**
 * Get current valid authentication session, creating one if needed
 */
async function getAuthSession(): Promise<AuthSession> {
  // Check if we have a valid session (not expired due to inactivity)
  if (
    currentAuthSession &&
    (Date.now() - currentAuthSession.lastActivity) < SESSION_TIMEOUT &&
    currentAuthSession.sessionId &&
    currentAuthSession.nonce
  ) {
    updateSessionActivity();
    return currentAuthSession;
  }

  // If session creation is already in progress, wait for it
  if (sessionCreationPromise) {
    return await sessionCreationPromise;
  }

  // Create new session if expired or doesn't exist
  console.log(`[AUTH] Session expired or missing, creating new session...`);
  sessionCreationPromise = createAuthSession().then((session) => {
    currentAuthSession = session;
    sessionCreationPromise = null; // Clear the promise after completion
    return session;
  }).catch((error) => {
    sessionCreationPromise = null; // Clear the promise on error
    throw error;
  });
  
  return await sessionCreationPromise;
}

/**
 * Get authentication parameters (AuthSession and AuthData) for API requests
 */
export async function getAuthParams(): Promise<{ AuthSession: string; AuthData: string }> {
  if (!DIGIFORT_USERNAME) {
    // If no username provided, return empty (for testing with mock server)
    console.log(`[AUTH] No username provided, skipping authentication`);
    return { AuthSession: "", AuthData: "" };
  }
  
  // Password can be empty, but username is required

  const session = await getAuthSession();
  const authData = calculateAuthData(DIGIFORT_USERNAME, DIGIFORT_PASSWORD, session.nonce);

  // Warn if using placeholder credentials
  if (DIGIFORT_USERNAME.toLowerCase().includes("your_username") || 
      DIGIFORT_USERNAME.toLowerCase().includes("your_") ||
      DIGIFORT_PASSWORD.toLowerCase().includes("your_password") ||
      DIGIFORT_PASSWORD.toLowerCase().includes("your_")) {
    if (getAuthParamsLogCount === 0) {
      console.warn(`[AUTH] ⚠️  WARNING: Using placeholder credentials!`);
      console.warn(`[AUTH]    Username: ${DIGIFORT_USERNAME}`);
      console.warn(`[AUTH]    Please set actual credentials: $env:DIGIFORT_USERNAME="actual_username"`);
    }
  }

  // Always log first few requests for debugging
  if (getAuthParamsLogCount < 3) {
    console.log(`[AUTH] Auth params:`, {
      sessionId: session.sessionId,
      nonce: session.nonce,
      username: DIGIFORT_USERNAME.toUpperCase(),
      authData: authData,
    });
    getAuthParamsLogCount++;
  }

  return {
    AuthSession: session.sessionId.toString(),
    AuthData: authData,
  };
}

/**
 * Get Basic HTTP Authentication header (Base64 encoded username:password)
 * Handles empty passwords (username:)
 */
export function getBasicAuthHeader(): string | null {
  if (!DIGIFORT_USERNAME) {
    console.log(`[AUTH] No username set, cannot create Basic auth header`);
    return null;
  }
  
  // Handle empty password - Basic auth format is "username:" even if password is empty
  const password = DIGIFORT_PASSWORD || "";
  const credentials = `${DIGIFORT_USERNAME}:${password}`;
  const encoded = Buffer.from(credentials).toString("base64");
  
  // Debug: Log first time
  if (!basicAuthHeaderLogged) {
    console.log(`[AUTH] Basic auth credentials:`, {
      username: DIGIFORT_USERNAME,
      password: password ? "***SET***" : "(empty)",
      credentials: `${DIGIFORT_USERNAME}:${password}`,
      encoded: encoded.substring(0, 10) + "...",
      header: `Basic ${encoded.substring(0, 10)}...`,
    });
    basicAuthHeaderLogged = true;
  }
  
  return `Basic ${encoded}`;
}

/**
 * Add authentication parameters to a URL (for Safe authentication)
 */
export async function addAuthToUrl(url: string): Promise<string> {
  // If using Basic auth, don't add params to URL
  if (AUTH_METHOD === "basic") {
    return url;
  }
  
  const authParams = await getAuthParams();
  
  if (!authParams.AuthSession || !authParams.AuthData) {
    return url; // No auth needed
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}AuthSession=${encodeURIComponent(authParams.AuthSession)}&AuthData=${encodeURIComponent(authParams.AuthData)}`;
}

/**
 * Clear current authentication session (force re-authentication)
 * Prevents concurrent clearing by multiple requests
 */
export async function clearAuthSession(): Promise<void> {
  // If already clearing, wait for it to complete
  if (sessionClearingPromise) {
    return await sessionClearingPromise;
  }
  
  sessionClearingPromise = (async () => {
    console.log(`[AUTH] Clearing authentication session`);
    currentAuthSession = null;
    sessionCreationPromise = null; // Also clear any pending session creation
    stopKeepAlive();
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
  })();
  
  await sessionClearingPromise;
  sessionClearingPromise = null;
}

/**
 * Initialize authentication on server startup
 */
export async function initializeAuth(): Promise<void> {
  if (!DIGIFORT_USERNAME) {
    console.log(`[AUTH] ⚠️  Authentication disabled: DIGIFORT_USERNAME not set`);
    console.log(`[AUTH]    Set environment variables to enable authentication`);
    console.log(`[AUTH]    Example: $env:DIGIFORT_USERNAME="admin"`);
    return;
  }
  
  console.log(`[AUTH] Credentials configured:`, {
    username: DIGIFORT_USERNAME,
    password: DIGIFORT_PASSWORD ? "***SET***" : "(empty - no password)",
    authMethod: AUTH_METHOD,
  });
  
  // Password can be empty
  if (!DIGIFORT_PASSWORD) {
    console.log(`[AUTH] ⚠️  No password set - using empty password for authentication`);
  }

  if (AUTH_METHOD === "basic") {
    console.log(`[AUTH] Using Basic HTTP Authentication`);
    console.log(`[AUTH] ✓ Authentication ready (Basic HTTP Auth)`);
    return;
  }

  try {
    console.log(`[AUTH] Using Safe Authentication`);
    console.log(`[AUTH] Initializing authentication...`);
    await createAuthSession();
    console.log(`[AUTH] ✓ Authentication initialized successfully`);
  } catch (error) {
    console.error(`[AUTH] ✗ Failed to initialize authentication:`, error);
    console.error(`[AUTH]    API requests will fail until authentication is established`);
  }
}

