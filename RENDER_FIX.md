# Render MIME Type Error Fix

## Issue
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "binary/octet-stream"
```

## Root Cause
The static file serving in `server/static.ts` was using `import.meta.dirname` which doesn't work correctly in the bundled CommonJS production build (`dist/index.cjs`).

## Fix Applied

### 1. Updated `server/static.ts`
- Added fallback path resolution for both development and production
- Added explicit MIME type headers for `.js`, `.mjs`, and `.css` files
- Added detailed logging to help debug path issues
- Now checks two locations for the `public` folder:
  - `dist/public` (when running from `dist/index.cjs`)
  - `../dist/public` (fallback)

### 2. Updated Documentation
- Enhanced `RENDER_DEPLOYMENT.md` with detailed troubleshooting steps
- Added specific MIME type error debugging guide

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix: Static file serving for Render production"
git push
```

### 2. Redeploy on Render
Render should auto-deploy if you have auto-deploy enabled. Otherwise:
- Go to Render Dashboard → Your Service
- Click "Manual Deploy" → "Deploy latest commit"

### 3. Check Build Logs
Look for these successful build messages:
```
building client...
✓ built in xxxms
building server...
Build complete
```

### 4. Check Runtime Logs
After deployment, check logs for:
```
[STATIC] Current directory: /opt/render/project/src/dist
[STATIC] Attempting to serve from: /opt/render/project/src/dist/public
[STATIC] Directory exists: true
[STATIC] ✓ Serving static files from: /opt/render/project/src/dist/public
```

### 5. Verify Environment Variables
Ensure these are set in Render Dashboard → Environment:
- `SERVE_CLIENT=true` ✅ Required
- `NODE_ENV=production` ✅ Required

## Expected File Structure on Render

After successful build:
```
/opt/render/project/src/
├── dist/
│   ├── index.cjs          # Bundled server (entry point)
│   └── public/            # Built React app
│       ├── index.html
│       └── assets/
│           ├── index-[hash].js
│           ├── index-[hash].css
│           └── ...
├── node_modules/
└── ...
```

## If Issue Persists

### Check These:

1. **Build completed successfully?**
   - Both client and server builds should complete
   - Check for any build errors in logs

2. **SERVE_CLIENT=true set?**
   - Must be set in Render environment variables
   - Check Render Dashboard → Environment tab

3. **Files exist after build?**
   - Access Render shell (if available)
   - Run: `ls -la dist/public/`
   - Should show `index.html` and `assets/` folder

4. **Path resolution logs**
   - Check runtime logs for `[STATIC]` messages
   - Should show the correct path and "Directory exists: true"

## Alternative: Force Rebuild

If auto-deploy doesn't work:
1. In Render Dashboard → Settings
2. Scroll to "Danger Zone"
3. Click "Clear Build Cache"
4. Trigger a new deploy

## Contact Points

If still not working, check:
- Render logs for the exact error
- The `[STATIC]` log messages showing where it's looking for files
- Share the full build log and runtime log for further debugging


