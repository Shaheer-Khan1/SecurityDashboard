# Debug Backend 502 Errors

## Immediate Steps

### 1. Test Backend Directly
Open in browser or use curl:
```
https://securitydashboardbackend.onrender.com/api/dashboard/stats
```

If you get 502, the backend is deployed but crashing or misconfigured.

### 2. Check Backend Logs
Go to: https://dashboard.render.com → securitydashboardbackend → **Logs**

Look for:
- ❌ `[PROXY] Error in proxyRequest` - Connection issues
- ❌ `ECONNREFUSED` - Can't connect to mock server
- ❌ `Mock server request failed` - Mock server returned error
- ❌ Server crash/exit messages
- ✅ `[server] running in API-only mode` - Server started correctly
- ✅ `[PROXY] Mock Server Request: https://...` - Correctly configured

### 3. Verify Environment Variables Are Set

In Render Dashboard → securitydashboardbackend → Environment, you MUST have:

```
MOCK_SERVER_URL=https://securitydashboardserver.onrender.com
NODE_ENV=production
CLIENT_ORIGIN=https://securitydashboard-0o2a.onrender.com
```

**Important:** Environment variables must be set BEFORE deploying, OR you need to redeploy after setting them.

### 4. Check Backend Build

In Logs, look for build messages:
- ✅ `building client...` ✓ built
- ✅ `building server...` ⚡ Done
- ✅ `Build successful 🎉`
- ❌ `Build failed` - Fix build errors first

### 5. Common Issues

#### Issue A: Environment Variable Not Set
**Symptom:** Logs show `localhost:8089` or `http://localhost:8089`
**Fix:** Set `MOCK_SERVER_URL=https://securitydashboardserver.onrender.com` in Render

#### Issue B: Mock Server URL Wrong
**Symptom:** Connection refused errors
**Fix:** Verify mock server URL is exactly: `https://securitydashboardserver.onrender.com` (no trailing slash)

#### Issue C: Backend Not Deployed
**Symptom:** No logs, service shows "stopped" or "failed"
**Fix:** Check service status, trigger manual deploy

#### Issue D: Build Failed
**Symptom:** Build logs show errors
**Fix:** Check build command: `npm install --include=dev && npm run build`

## Quick Test Commands

### Test Backend Health
```bash
curl https://securitydashboardbackend.onrender.com/api/dashboard/stats
```

### Test Mock Server
```bash
curl https://securitydashboardserver.onrender.com/Interface/Dashboard/Stats
```

### Test Frontend Calls Backend
Open: https://securitydashboard-0o2a.onrender.com
Check browser console (F12) for API call results

