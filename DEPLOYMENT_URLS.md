# Deployment URLs

## Production Services

### Frontend (React Static Site)
- **URL:** https://securitydashboard-0o2a.onrender.com
- **Service:** Static Site
- **Environment Variables:**
  - `VITE_API_URL=https://securitydashboardbackend.onrender.com`

### Backend (Node.js API)
- **URL:** https://securitydashboardbackend.onrender.com
- **Service:** Web Service (Node.js)
- **Environment Variables:**
  - `NODE_ENV=production`
  - `CLIENT_ORIGIN=https://securitydashboard-0o2a.onrender.com`
  - `MOCK_SERVER_URL=https://securitydashboardserver.onrender.com`

### Mock Server (Python Flask)
- **URL:** https://securitydashboardserver.onrender.com
- **Service:** Web Service (Python)
- **Status:** ✅ Running (verified)
- **Environment Variables:**
  - `PORT=10000` (auto-set by Render)

## API Flow

```
Frontend (React)
    ↓
    → https://securitydashboardbackend.onrender.com/api/*
          ↓
          → https://securitydashboardserver.onrender.com/Interface/*
```

## Configuration Files Updated

1. ✅ `client/src/lib/queryClient.ts` - Frontend API base URL
2. ✅ `server/routes.ts` - Backend mock server URL (reads from env)
3. ✅ `render.yaml` - All service configurations with correct URLs

## Environment Variables to Set in Render Dashboard

### Frontend Service (securitydashboard-0o2a)
```
VITE_API_URL=https://securitydashboardbackend.onrender.com
```

### Backend Service (securitydashboardbackend)
```
NODE_ENV=production
CLIENT_ORIGIN=https://securitydashboard-0o2a.onrender.com
MOCK_SERVER_URL=https://securitydashboardserver.onrender.com
```

### Mock Server Service (securitydashboardserver)
```
PORT=10000
```
(Render sets this automatically)

## Testing

### 1. Test Mock Server
```bash
curl https://securitydashboardserver.onrender.com/
```
Expected: `{"name":"Digifort Mock API Server","status":"running",...}`

### 2. Test Backend
```bash
curl https://securitydashboardbackend.onrender.com/api/dashboard/stats
```
Expected: Dashboard statistics JSON

### 3. Test Frontend
Visit: https://securitydashboard-0o2a.onrender.com
Expected: Dashboard loads with data from backend

## Deployment Checklist

- [x] Mock server deployed and running
- [ ] Backend environment variables set
  - [ ] `CLIENT_ORIGIN` → Frontend URL
  - [ ] `MOCK_SERVER_URL` → Mock server URL
  - [ ] `NODE_ENV=production`
- [ ] Frontend environment variable set
  - [ ] `VITE_API_URL` → Backend URL
- [ ] Redeploy backend after setting env vars
- [ ] Redeploy frontend after setting env vars
- [ ] Test all three services

## Next Steps

1. **Set Backend Environment Variables:**
   - Go to: https://dashboard.render.com → securitydashboardbackend → Environment
   - Add:
     - `CLIENT_ORIGIN=https://securitydashboard-0o2a.onrender.com`
     - `MOCK_SERVER_URL=https://securitydashboardserver.onrender.com`
     - `NODE_ENV=production`
   - Save and redeploy

2. **Set Frontend Environment Variable:**
   - Go to: https://dashboard.render.com → securitydashboard-0o2a → Environment
   - Add:
     - `VITE_API_URL=https://securitydashboardbackend.onrender.com`
   - Save and redeploy

3. **Commit and push code changes:**
   ```bash
   git add .
   git commit -m "Configure production URLs for all services"
   git push
   ```

4. **Verify deployment:**
   - Check mock server: https://securitydashboardserver.onrender.com
   - Check backend API: https://securitydashboardbackend.onrender.com/api/dashboard/stats
   - Check frontend: https://securitydashboard-0o2a.onrender.com

All services should now communicate correctly! 🎉

