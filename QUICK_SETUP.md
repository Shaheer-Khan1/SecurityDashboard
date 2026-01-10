# Quick Setup - Moscow Model

## ✅ Model Already Hosted

Your Moscow State University model is hosted on Cloudflare R2:
```
https://pub-1f4199dff194441a97e27f712ea8f466.r2.dev/moscow_state_university.glb
```

## Next Steps (2 minutes)

### Step 1: Verify the URL Works
Open this URL in your browser to confirm the file loads:
```
https://pub-1f4199dff194441a97e27f712ea8f466.r2.dev/moscow_state_university.glb
```

If you see a download prompt or the file loads, ✅ the URL is correct!

**If it doesn't work:**
- Make sure the file is named exactly `moscow_state_university.glb` in your R2 bucket
- Check that the bucket has public read access enabled
- Verify CORS settings allow requests from your frontend domain

### Step 2: Set Environment Variable in Render

1. Go to: https://dashboard.render.com
2. Click on your frontend service: **securitydashboard-0o2a** (or your frontend service name)
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `VITE_MOSCOW_MODEL_URL`
   - **Value:** `https://pub-1f4199dff194441a97e27f712ea8f466.r2.dev/moscow_state_university.glb`
6. Click **Save Changes**

### Step 3: Commit and Push Code

```bash
git add .
git commit -m "Add Cloudflare R2 model URL configuration"
git push
```

### Step 4: Redeploy Frontend

Render will auto-deploy when you push, OR:
1. Go to Render Dashboard → Your Frontend Service
2. Click **Manual Deploy** → **Deploy latest commit**

### Step 5: Test

1. Visit: https://securitydashboard-0o2a.onrender.com/moscow-university
2. Open browser console (F12)
3. Check Network tab - you should see:
   - Request to: `https://pub-1f4199dff194441a97e27f712ea8f466.r2.dev/moscow_state_university.glb`
   - Status: `200 OK`
   - Model should load in the 3D viewer

## Troubleshooting

### Model Not Loading?
1. **Check CORS:** Cloudflare R2 bucket needs CORS configured
   - Go to Cloudflare Dashboard → R2 → Your Bucket → Settings → CORS
   - Add:
     ```
     [
       {
         "AllowedOrigins": ["https://securitydashboard-0o2a.onrender.com"],
         "AllowedMethods": ["GET", "HEAD"],
         "AllowedHeaders": ["*"],
         "ExposeHeaders": ["ETag"],
         "MaxAgeSeconds": 3600
       }
     ]
     ```

2. **Check Public Access:**
   - R2 bucket must have public read access
   - Settings → Public Access → Enable

3. **Check File Name:**
   - File must be named exactly: `moscow_state_university.glb` (case-sensitive)

4. **Check Environment Variable:**
   - Make sure `VITE_MOSCOW_MODEL_URL` is set in Render
   - Variable names starting with `VITE_` are exposed to frontend code
   - Redeploy after adding environment variable

### Still Not Working?

Check browser console for errors:
- CORS error → Fix R2 CORS settings
- 404 error → Check file name/path in R2
- 403 error → Enable public access on bucket

## Current Configuration

✅ Code updated: `client/src/pages/moscow-university.tsx`
✅ Uses: `import.meta.env.VITE_MOSCOW_MODEL_URL || '/moscow_state_university.glb'`
✅ Fallback: Local file (for development)

## Expected Behavior

- **Development (localhost):** Uses local file `/moscow_state_university.glb`
- **Production (Render):** Uses Cloudflare R2 URL from environment variable

🎉 All set! Just add the environment variable and redeploy!

