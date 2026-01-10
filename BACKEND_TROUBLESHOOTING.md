# Backend 502 Error Troubleshooting

## Problem
Getting `502 Bad Gateway` errors from backend:
```
GET https://securitydashboardbackend.onrender.com/api/analytics/counters 502
GET https://securitydashboardbackend.onrender.com/api/cameras 502
```

## Root Cause
The backend is trying to connect to `http://localhost:8089` (default) instead of the deployed mock server URL.

## Solution: Set Environment Variable in Render

### Step 1: Check Backend Logs
Go to: https://dashboard.render.com → securitydashboardbackend → Logs

Look for errors like:
- `ECONNREFUSED` - Can't connect to mock server
- `fetch failed` - Network error
- `[PROXY] Mock server request failed` - Connection issue

### Step 2: Set MOCK_SERVER_URL Environment Variable

1. Go to: https://dashboard.render.com
2. Click: **securitydashboardbackend** (your backend service)
3. Click: **Environment** (left sidebar)
4. Add/Update environment variable:
   - **Key:** `MOCK_SERVER_URL`
   - **Value:** `https://securitydashboardserver.onrender.com`
5. Click: **Save Changes**

### Step 3: Verify All Environment Variables

Make sure these are set in your backend service:

✅ **Required:**
```
NODE_ENV=production
MOCK_SERVER_URL=https://securitydashboardserver.onrender.com
CLIENT_ORIGIN=https://securitydashboard-0o2a.onrender.com
```

❌ **Do NOT set:**
- `SERVE_CLIENT` - Leave this unset for API-only mode

### Step 4: Redeploy Backend

After setting environment variables:
1. Go to: securitydashboardbackend → **Manual Deploy**
2. Click: **Deploy latest commit**
3. Wait for deployment to complete

### Step 5: Check Logs Again

After redeploy, check logs for:
```
[PROXY] Mock Server Request: https://securitydashboardserver.onrender.com/Interface/...
```

If you see this, it means the backend is correctly configured!

## Common Issues

### Issue 1: Mock Server URL Missing
**Symptom:** Logs show `http://localhost:8089`  
**Fix:** Set `MOCK_SERVER_URL` environment variable

### Issue 2: Backend Not Running
**Symptom:** 502 errors, no logs showing  
**Fix:** Check if backend build completed successfully

### Issue 3: Mock Server Not Accessible
**Symptom:** Connection refused errors  
**Fix:** Verify mock server is running at https://securitydashboardserver.onrender.com

### Issue 4: CORS Issues
**Symptom:** CORS errors in logs  
**Fix:** Already handled by Flask-CORS in mock server

## Quick Test

Test if backend can reach mock server:
```bash
# From Render shell or local machine
curl https://securitydashboardserver.onrender.com/Interface/Dashboard/Stats
```

Should return JSON with dashboard stats.

## Expected Logs (After Fix)

When working correctly, backend logs should show:
```
[PROXY] Mock Server Request: https://securitydashboardserver.onrender.com/Interface/Cameras/GetCameras
[express] GET /api/cameras 200 in 50ms
```

## Still Not Working?

1. Check Render backend logs for specific error messages
2. Verify mock server is accessible: https://securitydashboardserver.onrender.com
3. Check network connectivity between services (should work automatically on Render)
4. Verify environment variables are saved (not just typed)

