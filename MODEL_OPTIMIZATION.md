# 3D Model Optimization Results

## Moscow State University Model

### Before Optimization
- **Size:** 109.85 MB
- **Status:** Too large for GitHub (100MB limit)
- **Hosting:** Required external CDN (Cloudflare R2)
- **Load time:** Very slow, blocked mobile devices

### After Optimization
- **Size:** 5.57 MB (95% reduction!)
- **Status:** Small enough for Git repository
- **Hosting:** Served directly from deployed frontend
- **Load time:** Fast, works on mobile

## Optimization Process

Used glTF Transform CLI with these optimizations:

```bash
npm install -g @gltf-transform/cli

gltf-transform optimize moscow_state_university.glb moscow_state_university-web.glb \
  --compress draco \
  --texture-compress webp \
  --texture-size 1024
```

### What Each Optimization Does

1. **Draco Compression** (`--compress draco`)
   - Compresses mesh geometry using Google's Draco algorithm
   - Reduces vertex data size by 90%+
   - Requires browser to decompress (all modern browsers support it)

2. **WebP Texture Compression** (`--texture-compress webp`)
   - Converts PNG/JPG textures to WebP format
   - 25-35% smaller than PNG, better quality than JPG
   - Supported by all modern browsers

3. **Texture Resizing** (`--texture-size 1024`)
   - Reduces maximum texture dimension to 1024x1024
   - Most 3D models don't need 4K textures for web viewing
   - Still looks great on screen, loads much faster

### Additional Optimizations Applied Automatically

- **Deduplication** - Removed duplicate meshes and materials
- **Vertex Welding** - Merged vertices at same position
- **Mesh Simplification** - Reduced polygon count while preserving shape
- **Pruning** - Removed unused data and empty nodes
- **Instance Detection** - Reused repeated geometry

## Results by Optimization Step

| Step | Time | Effect |
|------|------|--------|
| dedup | 5ms | Removed duplicate data |
| instance | 1ms | Found reusable instances |
| palette | 3ms | Optimized material palette |
| flatten | 2ms | Flattened scene hierarchy |
| join | 531ms | Merged compatible meshes |
| weld | 468ms | Welded vertices |
| simplify | 2,242ms | Reduced polygon count |
| resample | 0ms | Optimized animations |
| prune | 423ms | Removed unused data |
| sparse | 193ms | Optimized sparse data |
| textureCompress | 488ms | Compressed textures to WebP |
| draco | 312ms | Applied Draco compression |

**Total optimization time:** ~5 seconds

## File Size Breakdown

```
Original:  109.85 MB  ████████████████████████████████████████████████████
Optimized:   5.57 MB  ██▌
```

**Savings:** 104.28 MB (95% reduction)

## Loading Performance

### Before (109 MB)
- **3G Network:** 5-10 minutes
- **4G Network:** 30-60 seconds
- **WiFi:** 10-20 seconds
- **Mobile:** Often fails (memory limits)

### After (5.57 MB)
- **3G Network:** 15-30 seconds
- **4G Network:** 2-5 seconds
- **WiFi:** < 2 seconds
- **Mobile:** ✅ Works perfectly

## Browser Compatibility

All optimizations are supported by:
- ✅ Chrome 80+
- ✅ Firefox 90+
- ✅ Safari 14+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment Impact

### Old Approach (External CDN)
- Required Cloudflare R2 account
- Needed environment variable: `VITE_MOSCOW_MODEL_URL`
- Separate CORS configuration
- Additional CDN costs
- Extra request to external domain

### New Approach (Bundled)
- ✅ Model included in Git repository
- ✅ No environment variables needed
- ✅ No CORS issues
- ✅ No external dependencies
- ✅ Served from same domain as frontend
- ✅ Cached by browser with other assets

## Quality Comparison

The optimized model maintains excellent visual quality:
- ✅ All building details preserved
- ✅ Textures still sharp
- ✅ Colors accurate
- ✅ Lighting works correctly
- ✅ No visible artifacts

The human eye cannot detect the difference at normal viewing distances on a screen.

## Recommendations for Other Models

For the High School model (`Truong.glb`, 77 MB), apply the same optimization:

```bash
cd client/public/high-school/source
gltf-transform optimize Truong.glb Truong-optimized.glb \
  --compress draco \
  --texture-compress webp \
  --texture-size 1024
```

Expected result: ~4-5 MB (similar compression ratio)

## Tools Used

- **glTF Transform** - https://gltf-transform.dev/
- **Draco Compression** - https://google.github.io/draco/
- **WebP Format** - https://developers.google.com/speed/webp

## Further Reading

- [glTF Transform Documentation](https://gltf-transform.dev/cli.html)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Draco 3D Compression](https://github.com/google/draco)

