# Mock Server Deployment on Render

## Overview
Deploy the Python mock server as a **Web Service** on Render to provide API endpoints for your frontend/backend.

## Render Configuration

### Service Type
**Web Service** (Python)

### Settings

| Setting | Value |
|---------|-------|
| **Name** | `security-dashboard-mock-server` (or your preferred name) |
| **Environment** | Python 3 |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your production branch) |
| **Root Directory** | `mock_server` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `python app.py` |
| **Plan** | Free (or your preferred plan) |

### Environment Variables

Add these in Render Dashboard → Environment:

#### Required
```
PORT=10000
```

> **Note:** Render automatically sets `PORT`, but the code has a fallback to 8089. The PORT env var is optional but recommended.

## Build & Start Commands Summary

```
Root Directory:    mock_server
Build Command:     pip install -r requirements.txt
Start Command:     python app.py
```

## API Endpoints

Once deployed, your mock server will be available at:
```
https://your-mock-server.onrender.com/Interface/*
```

Example endpoints:
- `GET /Interface/Cameras/GetCameras`
- `GET /Interface/Cameras/GetGroups`
- `GET /Interface/Analytics/GetCounters`
- `GET /Interface/Dashboard/Stats`
- `GET /Interface/System/Status`
- `GET /Interface/Analytics/Chart`
- etc.

## Backend Configuration Update

After deploying the mock server, update your backend's `MOCK_SERVER_URL` environment variable:

```
MOCK_SERVER_URL=https://your-mock-server.onrender.com
```

Or in `server/routes.ts`, you can make it configurable:
```typescript
const MOCK_SERVER_URL = process.env.MOCK_SERVER_URL || "http://localhost:8089";
```

## Testing After Deployment

1. **Check if server is running:**
   ```
   curl https://your-mock-server.onrender.com/
   ```

2. **Should return:**
   ```json
   {
     "name": "Digifort Mock API Server",
     "version": "1.0.0",
     "status": "running",
     "endpoints": [...]
   }
   ```

3. **Test an endpoint:**
   ```
   curl https://your-mock-server.onrender.com/Interface/Dashboard/Stats
   ```

4. **Update backend** to use the new mock server URL

## Troubleshooting

### Build Fails
- Check Python version (should be 3.11+)
- Verify `requirements.txt` exists in `mock_server/` folder
- Check build logs for specific pip errors

### Server Not Starting
- Check runtime logs for Python errors
- Verify `app.py` exists in `mock_server/` folder
- Ensure PORT environment variable is set (Render sets this automatically)

### CORS Errors
- Flask-CORS is configured to allow all origins by default
- If issues persist, you can configure specific origins in `app.py`:
  ```python
  CORS(app, origins=["https://your-frontend-url.onrender.com"])
  ```

### Port Issues
- Render sets `PORT` automatically - the code uses `os.environ.get("PORT", 8089)`
- If custom port needed, set `PORT` environment variable in Render dashboard

## File Structure

After deployment:
```
mock_server/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
└── ...
```

## Performance Notes

- Free tier services spin down after inactivity (30-60 second cold start)
- Consider upgrading to paid plan for always-on service if needed for production
- Mock server is lightweight and should respond quickly once running

