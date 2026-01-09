# Render Deployment Configuration

## Render Service Configuration

### Service Type
**Web Service** (not Static Site)

### Build & Deploy Settings

#### Build Command
```bash
npm install && npm run build
```

#### Start Command
```bash
SERVE_CLIENT=true node dist/index.cjs
```

**OR** (if using npm script):
```bash
SERVE_CLIENT=true npm run start
```

### Environment Variables

Add these in Render Dashboard → Environment:

#### Required for Production
```
SERVE_CLIENT=true
NODE_ENV=production
PORT=10000
```

> **Note:** Render automatically sets `PORT` - you can use `PORT` or keep default 5000. Render will assign a port automatically.

#### Optional - Mock Server Configuration
If you're using the mock server (currently active):
```
MOCK_SERVER_URL=http://localhost:8089
```

> **Note:** For production, you'll need to deploy the mock server separately or use the Digifort API.

#### Optional - Digifort API Configuration
If switching to Digifort API (currently commented out):
```
DIGIFORT_API_URL=http://your-digifort-server:8601
DIGIFORT_USERNAME=your_username
DIGIFORT_PASSWORD=your_password
DIGIFORT_AUTH_METHOD=basic
```

#### Optional - CORS Configuration
If you need to allow specific origins:
```
CLIENT_ORIGIN=https://your-frontend-domain.com
```

### Render Dashboard Settings

#### General Settings
- **Name:** `security-dashboard` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your production branch)
- **Root Directory:** `/` (root of repository)

#### Build Settings
- **Build Command:** `npm install && npm run build`
- **Start Command:** `SERVE_CLIENT=true node dist/index.cjs`

#### Advanced Settings
- **Auto-Deploy:** `Yes` (deploys on git push)
- **Health Check Path:** `/api/dashboard/stats` (optional, for health monitoring)

### Build Output Structure

After build, Render will have:
```
/
├── dist/
│   ├── public/          # Client build (served as static files)
│   │   ├── index.html
│   │   └── assets/
│   └── index.cjs        # Server entry point
└── node_modules/        # Dependencies
```

### Important Notes

1. **Single Service:** This is a full-stack app - both frontend and backend run in one service
2. **Static Files:** The server serves the built React app from `dist/public/` when `SERVE_CLIENT=true`
3. **Port:** Render sets `PORT` automatically - your code already uses `process.env.PORT || "5000"`
4. **Build Time:** Build typically takes 2-5 minutes (installs deps + builds client + builds server)

### Health Check Endpoint

Optional health check URL:
```
https://your-service.onrender.com/api/dashboard/stats
```

Returns JSON with dashboard statistics - useful for Render's health monitoring.

### Troubleshooting

#### Build Fails
- Check Node.js version (should be 20.x)
- Verify all dependencies in `package.json`
- Check build logs for specific errors
- Ensure both client and server builds complete successfully

#### App Doesn't Load / Blank Page
- Verify `SERVE_CLIENT=true` is set in environment variables
- Check that `dist/public/index.html` exists after build
- Check Render logs for `[STATIC]` messages showing where it's serving from
- Look for "Could not find the build directory" error

#### 502 Bad Gateway
- Check if server is starting correctly
- Verify `PORT` environment variable (Render sets this automatically)
- Check server logs in Render dashboard
- Ensure no crashes during startup

#### MIME Type Errors (main.tsx: Expected JavaScript but got binary/octet-stream)
This means static files aren't being served correctly:

1. **Check Environment Variable:** Ensure `SERVE_CLIENT=true` is set in Render dashboard
2. **Check Build Logs:** Verify both build steps completed:
   ```
   building client...
   vite v5.x.x building for production...
   ✓ built in xxxms
   building server...
   Build complete
   ```
3. **Check Runtime Logs:** Look for these messages:
   ```
   [STATIC] Current directory: /opt/render/project/src/dist
   [STATIC] Attempting to serve from: /opt/render/project/src/dist/public
   [STATIC] Directory exists: true
   [STATIC] ✓ Serving static files from: /opt/render/project/src/dist/public
   ```
4. **If directory doesn't exist:** The build failed or output went to wrong location
5. **Check file structure:** In Render shell/logs, verify:
   ```
   dist/
   ├── index.cjs          # Server bundle
   └── public/            # Client build
       ├── index.html
       └── assets/
   ```

#### Manual Checks in Render Shell
If available, access Render shell and run:
```bash
ls -la dist/
ls -la dist/public/
cat dist/public/index.html | head -20
```

### Render Blueprint (render.yaml) - Optional

If you want to use Infrastructure as Code, create `render.yaml`:

```yaml
services:
  - type: web
    name: security-dashboard
    env: node
    buildCommand: npm install && npm run build
    startCommand: SERVE_CLIENT=true node dist/index.cjs
    envVars:
      - key: SERVE_CLIENT
        value: true
      - key: NODE_ENV
        value: production
    healthCheckPath: /api/dashboard/stats
```

### Mock Server Deployment (If Needed)

If you need the mock server in production, deploy it as a separate service:

**Service Type:** Web Service
**Build Command:** `pip install -r requirements.txt` (if you have one)
**Start Command:** `python mock_server/app.py`
**Environment Variables:**
```
PORT=8089
```

Then update your main service's `MOCK_SERVER_URL` to point to the mock server's Render URL.

