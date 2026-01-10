# Backend Deployment on Render

## Overview
Deploy the backend API as a separate **Web Service** on Render. The backend provides API endpoints that your frontend will call.

## Render Configuration

### Service Type
**Web Service** (not Static Site)

### Settings

| Setting | Value |
|---------|-------|
| **Name** | `security-dashboard-api` (or your preferred name) |
| **Environment** | Node |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your production branch) |
| **Root Directory** | `.` (leave blank - means project root) |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `node dist/index.cjs` |
| **Plan** | Free (or your preferred plan) |

### Environment Variables

Add these in Render Dashboard → Environment:

#### Required
```
NODE_ENV=production
```

> **Important:** Do **NOT** set `SERVE_CLIENT=true` for backend-only deployment! 
> The backend will run in API-only mode automatically when `NODE_ENV=production` and `SERVE_CLIENT` is not set.

> **Note:** Render automatically sets `PORT`, so you don't need to set it manually.

#### CORS Configuration
```
CLIENT_ORIGIN=https://your-frontend-app.onrender.com
```

**Important:** Replace `your-frontend-app.onrender.com` with your actual frontend URL!

#### Mock Server Configuration (If using mock server)
```
MOCK_SERVER_URL=http://localhost:8089
```

> **Note:** This won't work in production! You'll need to:
> 1. Deploy mock server separately, OR
> 2. Update code to use Digifort API, OR  
> 3. Integrate mock data directly into backend

#### Optional: Database Configuration
If you're using a database:
```
DATABASE_URL=your_database_url
```

## Build Process

The build command (`npm run build`) will:
1. Clean `dist/` directory
2. Build client → `dist/public/` (not used since frontend is separate)
3. Build server → `dist/index.cjs` (this is what runs!)

## Start Command

The start command runs:
```bash
node dist/index.cjs
```

This starts the Express server that handles all `/api/*` requests.

## API Endpoints

Once deployed, your backend will be available at:
```
https://your-backend-service.onrender.com/api/*
```

Example endpoints:
- `GET /api/dashboard/stats`
- `GET /api/cameras`
- `GET /api/analytics/chart`
- `GET /api/system/status`
- etc.

## Frontend Configuration

Update your frontend to call the backend API:

### Option 1: Environment Variable
Add to your frontend's Render environment:
```
VITE_API_URL=https://your-backend-service.onrender.com
```

Then in your frontend code, use:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Option 2: Hardcode (for testing)
Update your API client files to use:
```typescript
const API_URL = 'https://your-backend-service.onrender.com';
```

## CORS Configuration

The backend already has CORS enabled. Make sure `CLIENT_ORIGIN` environment variable includes your frontend URL:

```
CLIENT_ORIGIN=https://your-frontend-app.onrender.com
```

If you have multiple origins:
```
CLIENT_ORIGIN=https://your-frontend-app.onrender.com,http://localhost:5173
```

## Health Check

Optional: Set health check path in Render:
```
/api/dashboard/stats
```

This endpoint returns dashboard statistics and can be used to verify the service is running.

## Important Notes

### 1. Mock Server Issue
Your backend currently uses `MOCK_SERVER_URL=http://localhost:8089`. This won't work in production!

**Solutions:**
- **Option A:** Deploy mock server as separate service, update `MOCK_SERVER_URL` to its Render URL
- **Option B:** Switch to Digifort API (uncomment code in `server/routes.ts`)
- **Option C:** Move mock data directly into backend (recommended for production)

### 2. Cold Starts
Free tier services on Render spin down after inactivity. First request after spin-down may take 30-60 seconds. Consider upgrading to a paid plan for always-on service.

### 3. Environment Variables
Make sure all required environment variables are set in Render Dashboard, not just in code!

## Testing After Deployment

1. **Check if backend is running:**
   ```
   curl https://your-backend-service.onrender.com/api/dashboard/stats
   ```

2. **Should return JSON:**
   ```json
   {
     "totalCameras": 129,
     "activeCameras": 129,
     ...
   }
   ```

3. **Update frontend** to call the new backend URL

4. **Test from frontend** - all API calls should work!

## Troubleshooting

### Backend not starting
- Check Render logs for errors
- Verify `dist/index.cjs` exists after build
- Check Node.js version (should be 20.x or 22.x)

### CORS errors
- Verify `CLIENT_ORIGIN` includes your frontend URL
- Check backend logs for CORS rejection messages
- Make sure frontend is calling the correct backend URL

### 502 Bad Gateway
- Check if server is starting correctly
- Look for crashes in logs
- Verify PORT is set correctly

### API returns 502 / Upstream API unavailable
- This means mock server at `localhost:8089` is not accessible
- You need to deploy mock server separately or switch to Digifort API

