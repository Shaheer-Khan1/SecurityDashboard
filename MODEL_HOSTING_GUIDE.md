# 3D Model Hosting Guide

## ✅ Model Hosted on Cloudflare R2

The Moscow State University 3D model is now hosted on Cloudflare R2:
**URL:** `https://pub-1f4199dff194441a97e27f712ea8f466.r2.dev/moscow_state_university.glb`

## Problem
The Moscow State University 3D model (`moscow_state_university.glb`) is **105 MB**, which exceeds GitHub's 100MB file size limit. It cannot be committed to the repository.

## ✅ Solution Implemented
Using Cloudflare R2 public bucket for hosting the model.

## Solutions

### Option 1: GitHub Releases (Recommended - Free & Easy)

#### Steps:
1. **Create a GitHub Release:**
   - Go to: https://github.com/Shaheer-Khan1/SecurityDashboard/releases
   - Click **"Create a new release"**
   - Tag: `v1.0.0` (or any version)
   - Title: `3D Models`
   - Description: `Moscow State University 3D model for deployment`

2. **Upload the Model:**
   - Drag and drop `moscow_state_university.glb` into the release assets
   - Click **"Publish release"**

3. **Get the URL:**
   After publishing, right-click the file and copy link. It will look like:
   ```
   https://github.com/Shaheer-Khan1/SecurityDashboard/releases/download/v1.0.0/moscow_state_university.glb
   ```

4. **Set Environment Variable in Render:**
   - Go to: Frontend service → Environment
   - Add:
     ```
     VITE_MOSCOW_MODEL_URL=https://github.com/Shaheer-Khan1/SecurityDashboard/releases/download/v1.0.0/moscow_state_university.glb
     ```
   - Redeploy

✅ **Pros:** Free, reliable, no external service needed  
❌ **Cons:** Download from GitHub (may be slower than CDN)

---

### Option 2: Cloudinary (Free CDN)

#### Steps:
1. **Sign up:** https://cloudinary.com (Free tier: 25GB storage, 25GB bandwidth/month)

2. **Upload Model:**
   - Dashboard → Media Library → Upload
   - Upload `moscow_state_university.glb`
   - Set as **Public**

3. **Get URL:**
   Cloudinary will give you a URL like:
   ```
   https://res.cloudinary.com/your-cloud-name/raw/upload/v1234567890/moscow_state_university.glb
   ```

4. **Set Environment Variable:**
   ```
   VITE_MOSCOW_MODEL_URL=https://res.cloudinary.com/your-cloud-name/raw/upload/v1234567890/moscow_state_university.glb
   ```

✅ **Pros:** Fast CDN, optimized delivery, free tier  
❌ **Cons:** Requires external account

---

### Option 3: Optimize/Compress the Model

Reduce file size to under 100MB so it can be committed:

#### Tools:
1. **glTF-Transform CLI:**
   ```bash
   npx gltf-transform optimize moscow_state_university.glb moscow_optimized.glb
   ```

2. **Blender:**
   - Open model in Blender
   - File → Export → glTF 2.0
   - Enable compression options
   - Reduce texture sizes

3. **Online Tools:**
   - https://gltf.report/ (analyze and optimize)
   - https://products.aspose.app/3d/compressor

✅ **Pros:** Can commit to GitHub, faster loading  
❌ **Cons:** May lose quality, takes time

---

### Option 4: AWS S3 / Google Cloud Storage

#### AWS S3:
1. Create S3 bucket (public access)
2. Upload model
3. Get public URL: `https://your-bucket.s3.amazonaws.com/moscow_state_university.glb`
4. Set CORS policy to allow your frontend domain

#### Google Cloud Storage:
1. Create GCS bucket (public access)
2. Upload model
3. Get public URL: `https://storage.googleapis.com/your-bucket/moscow_state_university.glb`

✅ **Pros:** Reliable, scalable, CDN available  
❌ **Cons:** Costs money after free tier

---

## Implementation (Already Done)

The code has been updated to use an environment variable:

```typescript
// client/src/pages/moscow-university.tsx
const modelUrl = import.meta.env.VITE_MOSCOW_MODEL_URL || '/moscow_state_university.glb';
```

This means:
- **Local development:** Uses `/moscow_state_university.glb` (from your local file)
- **Production (Render):** Uses the URL from `VITE_MOSCOW_MODEL_URL` environment variable

---

## Recommended Approach

**For Quick Deployment:**
1. Use **GitHub Releases** (Option 1)
   - Upload file to release
   - Set `VITE_MOSCOW_MODEL_URL` in Render
   - Redeploy frontend
   - ✅ Working in 5 minutes!

**For Better Performance (Later):**
1. Optimize model to reduce size
2. Use Cloudinary CDN for faster loading

---

## Step-by-Step: GitHub Releases Method

### 1. Upload to GitHub Release
```bash
# Create a release on GitHub web interface
# Upload moscow_state_university.glb as an asset
```

### 2. Get URL
After upload, the URL will be:
```
https://github.com/Shaheer-Khan1/SecurityDashboard/releases/download/TAG/moscow_state_university.glb
```

### 3. Update Render Environment
Go to: https://dashboard.render.com → securitydashboard-0o2a → Environment

Add:
```
VITE_MOSCOW_MODEL_URL=https://github.com/Shaheer-Khan1/SecurityDashboard/releases/download/v1.0.0/moscow_state_university.glb
```

### 4. Commit Code Changes
```bash
git add client/src/pages/moscow-university.tsx
git commit -m "Load Moscow model from environment variable"
git push
```

### 5. Redeploy Frontend
Render will auto-deploy with the new code and environment variable.

---

## Testing

After deployment:
1. Visit: https://securitydashboard-0o2a.onrender.com/moscow-university
2. Open browser console (F12)
3. Check Network tab for model loading
4. Should see request to your hosted URL

---

## Fallback

If the external URL fails, the app will try to load from `/moscow_state_university.glb` (which won't exist in production, so handle loading errors gracefully in your 3D scene).

Consider adding a loading fallback or placeholder in the UI!

